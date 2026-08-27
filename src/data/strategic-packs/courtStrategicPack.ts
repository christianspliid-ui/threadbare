// src/data/strategic-packs/courtStrategicPack.ts
//
// Court-political behavior pack: influence, office, patronage, dynasty-building.
// Ambitions: ambition_found_dynasty
// Six templates covering the arc from political assessment to maintaining authority.

import type { StrategicActionTemplate } from '../../types/strategicAction';
import {
  FESTIVAL_BOOST_DELTA,
  FESTIVAL_BOOST_DURATION_TICKS,
} from '../strategic-action-constants';

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

  // ── Folded from the retired initiative pipeline (THR-1292 §3) ──────
  // These three were `initiative.*` templates with their own scorer, their own
  // progress phase and their own outcome executor. They are undertakings now:
  // the same fiction, resolved by checkpoint dice on the one strategic runtime.

  // 7. Found Order — establish a formal guild, order, or company
  {
    id: 'strategic_found_order',
    displayName: 'Found Order',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'court-political',
    reachProfile: { heart: 0.5, gold: 0.3, star: 0.2 },
    projectDuration: 10,
    activityProse: [
      'Drafting a charter. Finding the three names that make it real. An order is paperwork until someone signs.',
      'The hall is rented, the seal is cut. What remains is convincing anyone to care.',
    ],
    completionProse: [
      'The order has a hall, a seal, and members who answer to it. It exists.',
    ],
    catalystEncounterIds: ['encounter_guild_dispute'],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital'] },
    resourceHint: { wealthCost: 20, reachFloor: { heart: 0.25, gold: 0.15 } },
    // The faction payoff the retired `initiativeOutcomes` produced waits on the
    // `create_group` strategic op (doc 2's tier plan) — TODO(THR-1295). The hall ships now.
    mutationHint: { type: 'create_sublocation', sublocationTypeId: 'guild-hall', nameTemplate: "{actor}'s Order at {location}" },
  },

  // 8. Organize Festival — a celebration that lifts the settlement, for a while
  {
    id: 'strategic_organize_festival',
    displayName: 'Organize Festival',
    verb: 'change',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'court-political',
    reachProfile: { heart: 0.6, gold: 0.3, star: 0.1 },
    projectDuration: 5,
    activityProse: [
      'Booking players, buying wine, arguing with the granary about how much can be spared.',
      'A festival is logistics wearing a mask. The mask is the point.',
    ],
    completionProse: [
      'The square is full and loud. For a few days the place forgets what it was worried about.',
    ],
    catalystEncounterIds: ['encounter_festival_brawl'],
    targetRule: { type: 'location_subtype', subtypes: ['town', 'city', 'capital', 'hamlet'] },
    resourceHint: { wealthCost: 10, reachFloor: { heart: 0.25 } },
    // The boost expires via `EXPIRING_LOCATION_PROPERTIES`, swept in phaseStrategicProjects —
    // the retired initiative phase owned the only expiry for it (THR-1292 §3).
    mutationHint: {
      type: 'modify_location_property',
      property: 'festivalBoost',
      delta: FESTIVAL_BOOST_DELTA,
      clamp: [0, 1],
      expiresAfterTicks: FESTIVAL_BOOST_DURATION_TICKS,
    },
  },

  // 9. Establish Spy Network — informants, planted eyes, an ongoing ear in the city
  {
    id: 'strategic_establish_spy_network',
    displayName: 'Establish Spy Network',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'court-political',
    reachProfile: { shadow: 0.5, eye: 0.4, gold: 0.1 },
    projectDuration: 10,
    activityProse: [
      'Paying a laundress. Paying a gate clerk. Paying someone who watches the ones being paid.',
      'A network is not built. It is grown, one small betrayal at a time.',
    ],
    completionProse: [
      'The city talks to you now, in the small hours, through people nobody looks at twice.',
    ],
    catalystEncounterIds: ['encounter_informant_exposed'],
    targetRule: { type: 'location_subtype', subtypes: ['city', 'capital'] },
    resourceHint: { wealthCost: 18, reachFloor: { shadow: 0.3, eye: 0.2 } },
    checkpointDifficulty: 0.5,
    payoffValue: 0.75,
    motivations: ['loyalty_ambition', 'honesty_cunning'],
    // Contacts are people the world keeps — a network whose members evaporate is a
    // property flag wearing an organisation's name.
    cast: [
      {
        key: 'contact',
        kind: 'actor',
        persistence: 'must-persist',
        acceptedRoles: ['informant', 'clerk', 'fence', 'lookout', 'attendant'],
        mintRole: 'informant',
      },
    ],
    mutationHint: { type: 'record_intelligence', intelligenceType: 'spy_network_established' },
  },

  // ── The `network` kind's update and counter-play (THR-1297 §5, slice 5) ──

  // 8. Extend Reach — **the first `remote: true` template in the corpus.**
  //    Extending a network is exactly the case §6 drew the remote line around: the
  //    work happens somewhere the actor is not, through people the actor commands.
  //    Walking there would be travel; reaching there is the network's whole point.
  {
    id: 'strategic_extend_reach',
    displayName: 'Extend Reach',
    verb: 'change',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'court-political',
    reachProfile: { shadow: 0.5, eye: 0.3, gold: 0.2 },
    projectDuration: 6,
    activityProse: [
      'A name passed to a name. The far town does not know it has been reached into yet.',
      'Reach is patience plus other people. Mostly other people.',
    ],
    completionProse: [
      'The network answers from further out than it did. Nobody travelled to make that true.',
    ],
    catalystEncounterIds: ['encounter_informant_exposed'],
    targetRule: { type: 'location_subtype', subtypes: ['city', 'capital', 'town', 'port'] },
    resourceHint: { wealthCost: 12, reachFloor: { shadow: 0.3 } },
    checkpointDifficulty: 0.5,
    // The one field that makes this the gate's first live subject.
    remote: true,
    payoffValue: 0.8,
    motivations: ['loyalty_ambition', 'revelation_discretion'],
    mutationHint: { type: 'record_intelligence', intelligenceType: 'network_reach_extended' },
  },

  // 9. Sever the Network — counter-play. Motive-gated: unpicking somebody's web of
  //    people is the definition of an act that needs a reason behind it.
  {
    id: 'strategic_sever_network',
    displayName: 'Sever the Network',
    verb: 'destroy',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'court-political',
    reachProfile: { shadow: 0.5, iron: 0.3, eye: 0.2 },
    projectDuration: 5,
    activityProse: [
      'Finding the one who will talk first. There is always one, and they are never the obvious one.',
      'You do not cut a network. You make it distrust itself and then watch.',
    ],
    completionProse: [
      'The network stops answering. Some of it walked away; some of it simply stopped existing.',
    ],
    catalystEncounterIds: ['encounter_informant_exposed'],
    targetRule: { type: 'location_subtype', subtypes: ['city', 'capital'] },
    resourceHint: { reachFloor: { shadow: 0.35 } },
    checkpointDifficulty: 0.55,
    payoffValue: 0.7,
    motivations: ['mercy_ruthlessness', 'honesty_cunning'],
    motiveGate: ['rivalry', 'grudge', 'contested_ambition', 'faction_war'],
    mutationHint: { type: 'no_mutation' },
  },

  // ── The `leverage_mark` kind: the T1 vertical slice (THR-1281 §8) ──
  //
  // Cultivate → press → burn, and the arc is genuinely sequential rather than three
  // verbs sharing a noun: `pressTheMark` refuses without a held mark, and burning
  // spends what pressing left. All three target *the room* (`colocated_actor`), because
  // a secret is something held about someone you have met.

  // 10. Cultivate Informant — create.
  {
    id: 'strategic_cultivate_informant',
    displayName: 'Cultivate Informant',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'court-political',
    reachProfile: { shadow: 0.4, heart: 0.35, eye: 0.25 },
    projectDuration: 5,
    activityProse: [
      'Small kindnesses, precisely aimed. None of them are free and both parties know it.',
      'Learning what they are afraid of. Not using it yet — that comes later, and later is the point.',
    ],
    completionProse: [
      'They tell you something they should not have. The shape of the hold is set now.',
    ],
    catalystEncounterIds: ['encounter_informant_exposed'],
    targetRule: {
      type: 'colocated_actor',
      roles: ['clerk', 'attendant', 'steward', 'innkeeper', 'entertainer', 'guard', 'scribe'],
    },
    resourceHint: { wealthCost: 10, reachFloor: { shadow: 0.2, heart: 0.2 } },
    checkpointDifficulty: 0.45,
    payoffValue: 0.6,
    motivations: ['honesty_cunning', 'loyalty_ambition'],
    mutationHint: { type: 'mint_leverage_mark', secretType: 'indiscretion', magnitude: 0.6 },
  },

  // 11. Press the Mark — use. Turns the hold into a debt the social systems read.
  {
    id: 'strategic_press_the_mark',
    displayName: 'Press the Mark',
    verb: 'change',
    executionMode: 'instant',
    behaviorFamily: 'court-political',
    reachProfile: { shadow: 0.45, heart: 0.3, gold: 0.25 },
    activityProse: [
      'No threat is made. None needs to be; the silence does the work.',
    ],
    completionProse: [
      'They agree to the thing. Something between the two of you has changed hands.',
    ],
    // Only people this actor actually holds something over. Without the edge filter
    // the press is offered against any co-located clerk and refuses on all of them —
    // measured 3 completions, 0 debts, before this line existed.
    targetRule: {
      type: 'colocated_actor',
      roles: ['clerk', 'attendant', 'steward', 'innkeeper', 'entertainer', 'guard', 'scribe'],
      withEdgeFromActor: 'knows_secret_of',
    },
    resourceHint: { reachFloor: { shadow: 0.25 } },
    checkpointDifficulty: 0.45,
    payoffValue: 0.65,
    motivations: ['honesty_cunning', 'mercy_ruthlessness'],
    mutationHint: { type: 'press_the_mark', favorMagnitude: 0.5, context: 'a silence kept' },
  },

  // 12. Burn the Mark — spending it outright.
  //
  //     **`verb: 'change'`, and the corpus invariant is why.** This shipped first as a
  //     `destroy` on the reasoning that the registry's D column means *counter-play*,
  //     so a self-spend could be a destroy verb that simply was not counter-play. The
  //     registry test refused it — its rule is corpus-wide ("no shipped destroy verb
  //     without a motive gate"), not row-scoped, and it was right to be: an ungated
  //     destroy is offerable against anyone for no reason, and the target rule was the
  //     only thing keeping this one pointed at the actor's own marks. That is a
  //     safety property resting on authoring discipline, which is exactly what the
  //     gate exists to stop.
  //
  //     Spending your own leverage is a *change* to something you hold. The finality
  //     lives in the prose and in the mark it consumes, not in the verb.
  {
    id: 'strategic_burn_the_mark',
    displayName: 'Burn the Mark',
    verb: 'change',
    executionMode: 'instant',
    behaviorFamily: 'court-political',
    reachProfile: { shadow: 0.4, iron: 0.35, heart: 0.25 },
    activityProse: [
      'Saying it out loud, in the room where it costs them most.',
    ],
    completionProse: [
      'The secret is spent. It will never be worth anything again, and it was worth a great deal once.',
    ],
    // Same reason as the press: you cannot burn what you do not hold.
    targetRule: {
      type: 'colocated_actor',
      roles: ['clerk', 'attendant', 'steward', 'innkeeper', 'entertainer', 'guard', 'scribe'],
      withEdgeFromActor: 'knows_secret_of',
    },
    resourceHint: { reachFloor: { shadow: 0.25 } },
    checkpointDifficulty: 0.4,
    payoffValue: 0.5,
    motivations: ['mercy_ruthlessness', 'sacrifice_survival'],
    mutationHint: { type: 'no_mutation' },
  },

  // 13. Expose the Mark — the kind's actual counter-play: somebody else surfaces the
  //     hold you were keeping, and it stops being leverage.
  {
    id: 'strategic_expose_mark',
    displayName: 'Expose the Hold',
    verb: 'destroy',
    executionMode: 'instant',
    behaviorFamily: 'court-political',
    reachProfile: { eye: 0.4, shadow: 0.35, heart: 0.25 },
    activityProse: [
      'Telling the subject what is held over them, and by whom. The rest takes care of itself.',
    ],
    completionProse: [
      'The hold is public, and a public hold is no hold at all.',
    ],
    targetRule: {
      type: 'colocated_actor',
      roles: ['clerk', 'attendant', 'steward', 'innkeeper', 'entertainer', 'guard', 'scribe'],
    },
    resourceHint: { reachFloor: { eye: 0.25 } },
    checkpointDifficulty: 0.5,
    payoffValue: 0.55,
    motivations: ['revelation_discretion', 'honesty_cunning'],
    motiveGate: ['rivalry', 'grudge', 'contested_ambition', 'faction_war'],
    mutationHint: { type: 'no_mutation' },
  },
];

/** Look up a court strategic template by ID */
export function getCourtTemplate(id: string): StrategicActionTemplate | undefined {
  return COURT_STRATEGIC_TEMPLATES.find(t => t.id === id);
}
