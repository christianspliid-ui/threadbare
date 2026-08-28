// src/data/strategic-packs/wandererStrategicPack.ts
//
// Wanderer-explorer behavior pack: charting the unmapped (THR-1297 §7, slice 5).
//
// **Why a seventh pack exists.** The field survey measured 700 of 798 idle decisions
// happening at lairs — agents standing in the wilderness with nothing the catalog
// could offer them, because no template in six packs names a wilderness subtype as a
// target. `wanderer-explorer` was already a declared `BehaviorFamily` with a
// presentation row and no pack behind it, which made it the cleanest possible landing:
// the union member, the glyph and the colour were waiting; only the verbs were missing.
//
// **The arc.** Chart the wilds → follow the chart → what you found is a lead the world
// can act on. The outputs are deliberately the *existing* economies — `knows_clue_of`
// leads the ruins layer converges, `knows_of` familiarity, treasure-map possessions the
// consumption sweep already spends — so an explorer's find enters play instead of
// accumulating in a private property bag. That is the difference between a kind and a
// counter.
//
// **Stage locality: the plan's §7 assumption was measured and is false.** §7 point 3
// authored `requiresLocation: true` for these verbs on the reasoning that "their
// targets are the wilderness features around where the idle agents already stand, so
// presence is satisfiable by construction". It is not: `findValidTargets` resolves a
// `location_subtype` rule by scanning **every** location in the graph (868 on a medium
// map) and slicing the first eight, with no proximity filter anywhere in the path. All
// three agents pursuing `ambition_escape_cursed_land` picked the same distant site.
//
// Measured, seed 42 / medium / 150 ticks — the two arms differ only in this flag:
//
//   requiresLocation: true   →  chart 0 completed / 4 failed, follow 0 / 3
//                               0 treasure maps, 0 clues — the kind produced nothing
//   requiresLocation: false  →  chart 3 completed / 6 failed, follow 11 / 2
//                               3 treasure maps, 4 clues
//
// So the multi-tick chart verbs ship `false`, which is the remedy the plan's own kill
// criterion prescribes for exactly this ("the values are wrong for the world as it is;
// revert to `false` for the offending kinds and record which"). The instant verbs omit
// the field: checkpoints never run for them, so any value there is decoration.
//
// Slice 5 predicted the remedy would be a proximity-aware target rule, "which would let
// locality hold without starving the kind". **THR-1310 shipped that rule and re-measured:
// the prediction was wrong.** With targeting proximity-bounded, seeds 42 and 99 at 150
// ticks still report the wanderer family 0/115 and 0/31 rolled at `requiresLocation:
// true` — 100% `actor_absent`, the same total inertness as before.
//
// The reason is that proximity and presence are different claims. A near target is not a
// *present* one, and `isActorAtStage` demands presence; nothing in the engine moves an
// agent toward its undertaking's stage, because that mover is doc 3's binder and has not
// shipped (see `UNDERTAKING_DEFAULT_REQUIRES_LOCATION`'s note, and TODO(THR-1294)).
// Targeting was never the whole cause — it was the visible half of a two-part gap.
//
// So these verbs keep `false`, now on sharper evidence than slice 5 had: not "we could
// not tell why presence starves the kind" but "presence starves it for a reason a
// targeting fix provably cannot reach". Re-measure when the binder lands, not before.

import type { StrategicActionTemplate } from '../../types/strategicAction';

/**
 * The wilderness a chart verb may name.
 *
 * Lairs and ruins plus the anomaly subtypes `worldSeed` seeds — every one an existing
 * `location` node that no shipped template has ever targeted. Deliberately excludes
 * settlements: a chart of a town is a survey, and the merchant and scholar packs own
 * that ground already.
 */
export const WILDERNESS_TARGET_SUBTYPES: readonly string[] = [
  'lair', 'cleared_lair', 'ruins', 'oasis',
  // Anomalies — discovery
  'cavern', 'grove', 'hot_spring', 'shipwreck', 'monument', 'ancient_road',
  // Anomalies — economy / treasure
  'gem_deposit', 'golden_grove', 'crystal_cavern', 'ancient_vault',
  'sunken_treasury', 'herb_garden', 'fossil_bed', 'iron_seep',
  'pearl_shoal', 'glowcap_hollow',
  // Anomalies — danger
  'nest', 'haunted_ground', 'corruption_zone',
];

export const WANDERER_STRATEGIC_TEMPLATES: readonly StrategicActionTemplate[] = [
  // 1. Walk the Unmapped — the cheap opening move: be somewhere, and know it after.
  {
    id: 'strategic_walk_the_unmapped',
    displayName: 'Walk the Unmapped',
    verb: 'gather_info',
    executionMode: 'instant',
    behaviorFamily: 'wanderer-explorer',
    reachProfile: { eye: 0.5, stone: 0.3, star: 0.2 },
    activityProse: [
      'No road here, so the walking is the map. Ridge, then water, then the way down.',
      'Counting paces between landmarks. It is not elegant, but it will be true.',
    ],
    completionProse: [
      'The ground is known now — not owned, not held, just known. That is enough to come back.',
    ],
    targetRule: { type: 'location_subtype', subtypes: WILDERNESS_TARGET_SUBTYPES },
    resourceHint: { reachFloor: { eye: 0.15 } },
    checkpointDifficulty: 0.4,
    // No `requiresLocation`: instant verbs run no checkpoints, so the flag is inert.
    payoffValue: 0.5,
    motivations: ['tradition_novelty', 'courage_prudence'],
    mutationHint: { type: 'seed_knows_of' },
  },

  // 2. Chart the Wilds — the create verb of the `chart_find` kind.
  //    Mints the map as a *possession*, which is what makes the find takeable and
  //    therefore what gives the kind its counter-play.
  {
    id: 'strategic_chart_the_wilds',
    displayName: 'Chart the Wilds',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'wanderer-explorer',
    reachProfile: { eye: 0.5, stone: 0.3, veil: 0.2 },
    projectDuration: 6,
    activityProse: [
      'Sight lines, pacing, a fixed star when the weather allows one. The chart accretes.',
      'Every wrong turn is data. Expensive data, but the chart does not care how it was bought.',
    ],
    completionProse: [
      'The chart is finished. Somewhere on it is a mark only its maker can read.',
    ],
    catalystEncounterIds: ['encounter_ruin_trap', 'encounter_ancient_guardian'],
    targetRule: { type: 'location_subtype', subtypes: WILDERNESS_TARGET_SUBTYPES },
    resourceHint: { wealthCost: 25, reachFloor: { eye: 0.25 } },
    checkpointDifficulty: 0.45,
    // `false` by measurement, not by preference — see the header. At `true` this verb
    // completed zero times in 150 ticks and the whole `chart_find` kind was inert.
    requiresLocation: false,
    payoffValue: 0.7,
    motivations: ['tradition_novelty', 'courage_prudence', 'revelation_discretion'],
    // The guide is a real person the world keeps — a chart bought with someone's
    // local knowledge should leave that someone standing there afterwards.
    cast: [
      {
        key: 'guide',
        kind: 'actor',
        persistence: 'must-persist',
        acceptedRoles: ['ranger', 'hunter', 'hermit', 'scout', 'wanderer'],
        mintRole: 'ranger',
      },
    ],
    mutationHint: { type: 'mint_treasure_map' },
  },

  // 3. Follow the Chart — the update verb: a lead sharpened into one the ruins
  //    layer will converge. This is where the explorer arc rejoins the world.
  {
    id: 'strategic_follow_the_chart',
    displayName: 'Follow the Chart',
    verb: 'change',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'wanderer-explorer',
    reachProfile: { eye: 0.4, stone: 0.3, iron: 0.2, veil: 0.1 },
    projectDuration: 5,
    activityProse: [
      'The chart says here. Here says otherwise. One of them is lying and it is usually the chart.',
      'Walking the mark down. The closer it gets the less the country cooperates.',
    ],
    completionProse: [
      'The mark resolves into a place. Whatever is in it does not know it has been found.',
    ],
    catalystEncounterIds: ['encounter_ruin_trap'],
    targetRule: { type: 'location_subtype', subtypes: WILDERNESS_TARGET_SUBTYPES },
    resourceHint: { wealthCost: 15, reachFloor: { eye: 0.3, stone: 0.2 } },
    checkpointDifficulty: 0.5,
    // Same measurement: 0 completions at `true`, 11 at `false`.
    requiresLocation: false,
    payoffValue: 0.8,
    motivations: ['tradition_novelty', 'revelation_discretion'],
    mutationHint: { type: 'spawn_clue', magnitude: 0.6, precision: 0.7, detail: 'followed from a chart' },
  },

  // 4. Burn the Charts — the counter-play. Motive-gated: a chart is somebody's
  //    season of walking, and destroying it without a quarrel is the motiveless
  //    demolition slice 2's gate exists to refuse.
  {
    id: 'strategic_burn_the_charts',
    displayName: 'Burn the Charts',
    verb: 'destroy',
    executionMode: 'instant',
    behaviorFamily: 'wanderer-explorer',
    reachProfile: { shadow: 0.5, eye: 0.3, iron: 0.2 },
    activityProse: [
      'Paper takes badly to weather and well to fire. Someone has learned which.',
    ],
    completionProse: [
      'The charts are ash. The country they described is exactly as far away as it ever was.',
    ],
    targetRule: { type: 'location_subtype', subtypes: WILDERNESS_TARGET_SUBTYPES },
    resourceHint: { reachFloor: { shadow: 0.2 } },
    checkpointDifficulty: 0.45,
    // No `requiresLocation`: instant verbs run no checkpoints, so the flag is inert.
    payoffValue: 0.55,
    motivations: ['mercy_ruthlessness', 'honesty_cunning'],
    motiveGate: ['rivalry', 'grudge', 'contested_ambition', 'faction_war'],
    mutationHint: { type: 'no_mutation' },
  },
];

/** Look up a wanderer strategic template by ID */
export function getWandererTemplate(id: string): StrategicActionTemplate | undefined {
  return WANDERER_STRATEGIC_TEMPLATES.find(t => t.id === id);
}
