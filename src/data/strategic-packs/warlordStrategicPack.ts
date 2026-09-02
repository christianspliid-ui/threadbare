// src/data/strategic-packs/warlordStrategicPack.ts
//
// Warlord-expansion behavior pack: military reconnaissance, fortification, territorial control.
// Ambitions: ambition_conquer_territory
// Six templates covering the arc from scouting through garrison to territorial claim.

import type { StrategicActionTemplate } from '../../types/strategicAction';

export const WARLORD_STRATEGIC_TEMPLATES: readonly StrategicActionTemplate[] = [
  // 1. Scout Defenses — military reconnaissance of a target
  {
    id: 'strategic_scout_defenses',
    displayName: 'Scout Defenses',
    verb: 'gather_info',
    executionMode: 'instant',
    behaviorFamily: 'warlord-expansion',
    reachProfile: { eye: 0.6, iron: 0.3, shadow: 0.1 },
    activityProse: [
      'Counting the guards. Measuring the walls. Noting the watch patterns.',
      'A good commander knows the enemy before the enemy knows there is a war.',
    ],
    completionProse: [
      'Defenses assessed. Strengths and weaknesses noted.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['castle', 'fort', 'town', 'city', 'capital'] },
    resourceHint: { reachFloor: { eye: 0.2 } },
    motivations: ['revelation_discretion', 'mercy_ruthlessness'],
    mutationHint: { type: 'record_intelligence', intelligenceType: 'defense_scouting' },
  },

  // 2. Recruit Warband — gather fighting strength.
  //
  // **This template used to mint nobody** (THR-1309). Its mutation wrote an
  // intelligence record called `warband_recruited`, so the verb completed, entered the
  // completion history and was counted by every dashboard, while no band ever existed
  // — the "recruit-warband mirage" the T3 plan names. It now routes through
  // `create_group{company}` → `createGroup`, the single company mint site, so a
  // completed recruitment produces a real company node carrying `groupKind: 'company'`
  // with `member_of` and `commanded_by` edges.
  //
  // `requiresLocation` is deliberately absent (⇒ false). THR-1310's re-measurement
  // found the wanderer family at 0/115 rolled on seed 42 with `true` — 100%
  // `actor_absent` — because `isActorAtStage` demands presence and the mover that would
  // deliver it is doc 3's binder, unshipped. This verb does not need stage presence:
  // it recruits at the commander's own completion-time location.
  {
    id: 'strategic_recruit_warband',
    displayName: 'Recruit Warband',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'warlord-expansion',
    reachProfile: { iron: 0.5, heart: 0.3, gold: 0.2 },
    projectDuration: 6,
    activityProse: [
      'Posting notices. Testing arms. Turning farmers into soldiers.',
      'A warband is not hired — it is forged from desperation and ambition.',
    ],
    completionProse: [
      'The warband musters. Enough swords to make a claim worth defending.',
    ],
    catalystEncounterIds: ['encounter_desertion', 'encounter_warband_rivalry'],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'camp', 'fort'] },
    resourceHint: { wealthCost: 50, reachFloor: { iron: 0.3, heart: 0.2 } },
    checkpointDifficulty: 0.55,
    payoffValue: 2.0,
    motivations: ['courage_prudence', 'loyalty_ambition'],
    // **The cast, restored (THR-1321).** It is the trap-1 guarantee for this verb:
    // the recruits are a precondition the binding system supplies — minting when
    // nobody suitable is standing here — rather than a hope about who happens to be
    // at the commander's completion-time location.
    //
    // It was authored this way at THR-1309 and measured inert: 0 completions on both
    // persistence modes. The cause was not this template and not casts — it was
    // `strategicActionLifecycle`'s phase return rebuilding `strategicState` as a
    // literal naming only `projects`/`controls`/`history`, which dropped `mintQueue`
    // and `bindings` once per tick. A slot needing a mint enqueued a birth into a
    // queue that was discarded before the lifecycle valve could drain it, so it
    // deferred on `awaiting_mint` forever and timed out. `strategic_establish_spy_-
    // network` survived because its slot binds to somebody already present and rolls
    // in the same pass, never needing either field to cross a tick boundary. Fixed
    // with a `...currentState` spread; see the comment at that return.
    //
    // Measured after the fix, seeds 42/99 × 150 ticks, medium, each arm confirmed
    // applied before it ran — completions *and* bands standing, because a cast that
    // completes while minting nothing is the same defect wearing the other face:
    //   cast + fix   → 12 ok / 0 fail, 9 bands  ·  12 ok / 1 fail, 11 bands
    //   fix, no cast →  8 ok / 1 fail, 4 bands  ·  10 ok / 4 fail,  8 bands
    // The cast is ahead on both halves on both seeds, which is the comparison that
    // decides it: same engine, one variable.
    cast: [{
      key: 'recruit',
      kind: 'actor',
      persistence: 'must-persist',
      acceptedRoles: ['mercenary', 'guard', 'hunter', 'labourer', 'drifter'],
      mintRole: 'mercenary',
    }],
    mutationHint: { type: 'create_group', groupKind: 'company' },
  },

  // 3. Fortify Position — build defensive works at a strategic location
  {
    id: 'strategic_fortify_position',
    displayName: 'Fortify Position',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'warlord-expansion',
    reachProfile: { iron: 0.4, stone: 0.5, eye: 0.1 },
    projectDuration: 7,
    activityProse: [
      'Earthworks first, then palisade. The position hardens by the day.',
      'Every fortification is an argument made in timber and stone.',
    ],
    completionProse: [
      'The position is fortified. Ground that can be held.',
    ],
    catalystEncounterIds: ['encounter_siege_preparation', 'encounter_supply_raid'],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'camp', 'fort', 'castle'] },
    resourceHint: { wealthCost: 60, reachFloor: { iron: 0.3, stone: 0.3 } },
    motivations: ['preservation_transformation', 'mercy_ruthlessness'],
    mutationHint: { type: 'modify_location_property', property: 'defense', delta: 20, clamp: [0, 100] },
  },

  // 4. Establish Garrison — permanent military presence at a location
  {
    id: 'strategic_establish_garrison',
    displayName: 'Establish Garrison',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'warlord-expansion',
    reachProfile: { iron: 0.6, heart: 0.2, stone: 0.2 },
    projectDuration: 8,
    activityProse: [
      'Billeting troops. Establishing the watch rotation. Making the presence permanent.',
      'A garrison is a statement: this place is held, and will be held.',
    ],
    completionProse: [
      'The garrison is established. The banner flies over the gate.',
    ],
    catalystEncounterIds: ['encounter_garrison_mutiny', 'encounter_civilian_unrest'],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'castle', 'fort'] },
    resourceHint: { wealthCost: 80, reachFloor: { iron: 0.4, heart: 0.2 } },
    motivations: ['mercy_ruthlessness', 'loyalty_ambition'],
    mutationHint: { type: 'create_sublocation', sublocationTypeId: 'garrison', nameTemplate: "{actor}'s Garrison at {location}" },
  },

  // 5. Raid Supply Lines — disrupt enemy logistics
  {
    id: 'strategic_raid_supply_lines',
    displayName: 'Raid Supply Lines',
    verb: 'destroy',
    // THR-1298: what this harm registers as, so the outcome mints the right drive.
    // stores burned rather than taken.
    harmClass: 'property_destroyed',
    executionMode: 'instant',
    behaviorFamily: 'warlord-expansion',
    reachProfile: { iron: 0.5, shadow: 0.3, eye: 0.2 },
    activityProse: [
      'Ambush at the ford. Scatter the wagons. Take what is useful, burn what is not.',
      'War is not won in battle alone. It is won in the supply train.',
    ],
    completionProse: [
      'The supply line is severed. The enemy will feel the lack.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'camp', 'fort'] },
    resourceHint: { reachFloor: { iron: 0.3, shadow: 0.2 } },
    motivations: ['mercy_ruthlessness', 'honesty_cunning'],
    mutationHint: { type: 'modify_location_property', property: 'prosperity', delta: -8, clamp: [0, 100] },
    // THR-1297 §2 — the corpus' one destroy verb, and until now it could be fired at
    // any town in range with no quarrel behind it: a warlord starving a settlement
    // they had never heard of. The prose already assumes a war ("the enemy will feel
    // the lack"); this makes the world agree before the verb is offered.
    motiveGate: ['rivalry', 'grudge', 'faction_war'],
  },

  // 6. Claim Territory — establish territorial control
  {
    id: 'strategic_claim_territory',
    displayName: 'Claim Territory',
    verb: 'control',
    executionMode: 'claim_control',
    behaviorFamily: 'warlord-expansion',
    reachProfile: { iron: 0.6, heart: 0.2, eye: 0.2 },
    activityProse: [
      'Planting the banner. Drawing the border. Daring anyone to cross it.',
      'Territory is claimed in steel and held in vigilance.',
    ],
    completionProse: [
      'The territory answers to a new name. For now.',
    ],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'castle', 'fort'] },
    resourceHint: { reachFloor: { iron: 0.4 } },
    motivations: ['mercy_ruthlessness', 'loyalty_ambition'],
    mutationHint: { type: 'no_mutation' },
  },

  // ── Folded from the retired initiative pipeline (THR-1292 §3) ──────
  // 7. Recruit Companions — sworn bonds with those who will follow you
  {
    id: 'strategic_recruit_companions',
    displayName: 'Recruit Companions',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'warlord-expansion',
    reachProfile: { heart: 0.5, iron: 0.3, gold: 0.2 },
    projectDuration: 6,
    activityProse: [
      'Buying rounds. Telling the story again, better. Finding out who has nothing to lose.',
      'A companion is not hired. Hired ones leave when the pay stops.',
    ],
    completionProse: [
      'They have sworn to you. Whether the oath holds is a different question, asked later.',
    ],
    catalystEncounterIds: ['encounter_companion_test'],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'hamlet', 'camp'] },
    resourceHint: { wealthCost: 3, reachFloor: { heart: 0.2 } },
    motivations: ['loyalty_ambition', 'courage_prudence'],
    mutationHint: { type: 'create_relation_edge', edgeType: 'relates_to', direction: 'actor_to_target', properties: { basis: 'sworn_ally', sentiment: 0.6 } },
  },

  // ── T2 counter-play (THR-1308) ──────────────────────────────────
  //
  // Both are **cross-family destroys**: the merchant founds the route and the builder
  // founds the settlement, and neither can undo their own work. That asymmetry is the
  // design — counter-play the world does to you, not a self-spend you choose — and it
  // is why these two live in the warlord pack rather than beside the verbs they undo.

  // 8. Blockade the Road — the trade route kind's counter-play, and the T2 vertical
  //    slice's second half: a route founded, christened and owned, then a motivated
  //    warlord shuts it. Suspends rather than deletes, because `threatened` is the
  //    property `phaseProsperity` already reads — so the owner feels this as their
  //    town going hungry, not as an edge quietly changing shape.
  {
    id: 'strategic_blockade_route',
    displayName: 'Blockade the Road',
    verb: 'destroy',
    // THR-1298: what this harm registers as, so the outcome mints the right drive.
    // the route still exists; what is cut is the use of it.
    harmClass: 'network_severed',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'warlord-expansion',
    reachProfile: { iron: 0.5, eye: 0.3, shadow: 0.2 },
    projectDuration: 4,
    activityProse: [
      'Not a battle. A crossing, held. Everything that wants past has to come to you first.',
      'The road is only worth something if the wagons move. So the wagons stop.',
    ],
    completionProse: [
      'Nothing moves. The ledger at the far end starts saying things the owner does not want to read.',
    ],
    catalystEncounterIds: ['encounter_route_ambush', 'encounter_toll_dispute'],
    targetRule: { type: 'location_subtype', subtypes: ['market', 'town', 'city', 'trading_post', 'port'] },
    resourceHint: { wealthCost: 20, reachFloor: { iron: 0.3, eye: 0.2 } },
    checkpointDifficulty: 0.5,
    // Same measured reason as every other multi-tick verb in the corpus — see the
    // wanderer pack header and TODO(THR-1294).
    requiresLocation: false,
    payoffValue: 1.1,
    motivations: ['mercy_ruthlessness', 'courage_prudence'],
    motiveGate: ['rivalry', 'grudge', 'contested_ambition', 'faction_war'],
    mutationHint: { type: 'blockade_route' },
  },

  // 9. Put It to the Torch — the place-tier location kind's counter-play. A founded
  //    settlement is the largest thing an agent can make in this catalog, so its
  //    undoing is the slowest and the most gated.
  {
    id: 'strategic_raze_settlement',
    displayName: 'Put It to the Torch',
    verb: 'destroy',
    // THR-1298: what this harm registers as, so the outcome mints the right drive.
    // a settlement in ashes — the plan's canonical razing.
    harmClass: 'property_destroyed',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'warlord-expansion',
    reachProfile: { iron: 0.6, shadow: 0.3, heart: 0.1 },
    projectDuration: 5,
    activityProse: [
      'A season of somebody else\'s hope, and it burns at the same rate as anything else does.',
      'The people leave first. That is the part the songs omit and the survivors do not.',
    ],
    completionProse: [
      'Char and posts. In ten years it will be called ruins and nobody will remember whose it was.',
    ],
    catalystEncounterIds: ['encounter_civilian_unrest', 'encounter_garrison_mutiny'],
    targetRule: { type: 'location_subtype', subtypes: ['hamlet', 'camp', 'town'] },
    resourceHint: { wealthCost: 25, reachFloor: { iron: 0.35 } },
    checkpointDifficulty: 0.55,
    requiresLocation: false,
    payoffValue: 1.3,
    motivations: ['mercy_ruthlessness', 'preservation_transformation'],
    motiveGate: ['rivalry', 'grudge', 'contested_ambition', 'faction_war'],
    mutationHint: { type: 'modify_location_property', property: 'prosperity', delta: -25, clamp: [0, 100] },
  },

  // ── The `warband` kind's update (THR-1309) ──
  //
  // **Appended, not inserted.** `generateStrategicCandidates` walks an ambition's
  // `templateIds` in authoring order and breaks at
  // `STRATEGIC_MAX_CANDIDATES_PER_AMBITION` (5), so a mid-list insert silently pushes
  // a later template out of reach — that is finding 1 from the T2 slice, which failed
  // six assertions across two files before it was understood.
  {
    id: 'strategic_reinforce_warband',
    displayName: 'Reinforce the Warband',
    verb: 'change',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'warlord-expansion',
    reachProfile: { iron: 0.5, heart: 0.4, gold: 0.1 },
    projectDuration: 4,
    activityProse: [
      'Word goes out that the band is taking names again. It always is.',
      'Feeding more mouths than you did last season. That is what winning looks like from inside.',
    ],
    completionProse: [
      'More spears answer than left. The band is heavier now, and slower, and harder to break.',
    ],
    catalystEncounterIds: ['encounter_desertion', 'encounter_warband_rivalry'],
    // The band the commander *has* — not a location, and not a stranger's band. This
    // is the half that keeps selection and resolution agreeing (THR-1309 trap 1).
    targetRule: { type: 'group_node', groupKind: 'company', ownership: 'commanded_by_actor' },
    resourceHint: { wealthCost: 25, reachFloor: { iron: 0.25, heart: 0.2 } },
    checkpointDifficulty: 0.45,
    payoffValue: 1.4,
    motivations: ['courage_prudence', 'loyalty_ambition'],
    // **No `cast`, and unlike the create verb above this one is structural (THR-1321).**
    // The halt that kept a cast off both templates is fixed — but a cast still cannot
    // serve *this* template, for a reason that is about `targetRule`, not the binder.
    //
    // A cast slot's stage is `spec.anchor`'s bound node or, absent one, the
    // undertaking's own `targetNodeId`. This verb targets `{ type: 'group_node' }` —
    // the band the commander already has — so the stage resolves to a **group** node,
    // and `enqueueMint` places the mint there. Measured with the same cast the create
    // verb now carries, seeds 42/99 × 150 ticks: every mint landed
    // `locationId → actor:group` (4 and 1 respectively), i.e. a person standing inside
    // a group rather than anywhere on the map. `buildHexActorIndex` reads that
    // property, so those recruits are on no hex and visible to no location-scoped
    // reader. The undertaking still completes, which is what makes it worth writing
    // down: the defect is silent, not loud.
    //
    // Reinforcement does not need the guarantee anyway — `reinforce_group` adds to a
    // band that by definition already exists, so there is no empty-field case for a
    // cast to insure against. Giving this verb a cast needs a location-tier stage
    // first (an `anchor` slot resolving the band's own location), which is a design
    // question for the binder's anchor vocabulary rather than a content edit.
    mutationHint: { type: 'reinforce_group' },
  },
];

/** Look up a warlord strategic template by ID */
export function getWarlordTemplate(id: string): StrategicActionTemplate | undefined {
  return WARLORD_STRATEGIC_TEMPLATES.find(t => t.id === id);
}
