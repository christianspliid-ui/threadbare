/**
 * The Vertical Slice — the first eight encounters authored in the locked
 * THR-883 format, end to end (Christian's go, chat 2026-07-31).
 *
 * Five parents (one per catalog shape) and three authored sequels, built on
 * the MATURE system tier only (`Docs/canon/encounter-catalogs.md` § System):
 * movement, cards, traits, conditions, items, forks, carryover — with
 * economy/war/factions/agent-magic appearing as flavor at most.
 *
 *   1. The Unsafe Bridge        — Single Test                (Hook #205)
 *   2. Snow on the Pass         — Test & Consequence         (Hook: original)
 *   3. Riders Behind the Caravan— Puzzle–Investigation–Res.  (Hook #207)
 *   4. A Bargain at the Crossroads — Personality Fork        (Hook #206)
 *      └─ The Full Moon Collection (Seeded Sequel of 4)
 *   5. The Swindled Family      — Opt-in Complication        (Hook #204)
 *      ├─ The Swindler Found       (Seeded Sequel of 5)
 *      └─ The Grateful Kin         (Seeded Sequel of 5)
 *
 * Every design block is in the doc comment above its template. The Seeded
 * Sequel rule is enforced by `__tests__/vertical-slice.test.ts`: every
 * `encounter_seed.templateId` planted here must resolve to a template in this
 * file — a seed naming an unbuilt encounter is the THR-844 rot.
 *
 * Personalization notes (design-block question 8): where a sentence reads
 * "greets the traveler by name" or "he describes the gift", the personalized
 * surface (agent-name token in scene prose; a reach/archetype-keyed gift
 * glimpse) does not exist in the engine yet — the slice authors the narrated
 * form and the gap is ticketed (see the THR-883 checkpoint trail). Nothing
 * here carries a raw token no renderer resolves (the THR-868 lesson).
 *
 * Register: rule zero (game prose, not novel prose). Prose rule 7: no agent
 * history asserted anywhere — the sequels are where history legitimately
 * appears, because their parents mint it.
 */

import type {
  ActionStep,
  ActionStepBranch,
  StepNudge,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import { compileOpeningEnvelope, expandSettings } from '../settingClasses';

// ─── Slice tuning (NFP #1) ───────────────────────────────────────────

/** Ticks until the crossroads promise falls due (~11 game days — a moon's turn). */
export const SLICE_FULL_MOON_DELAY_TICKS = 132;
/** Ticks until the swindler resurfaces in a settlement (~8 game days). */
export const SLICE_SWINDLER_DELAY_TICKS = 96;
/** Ticks until word of the kindness runs ahead of the traveler (~20 game days). */
export const SLICE_KIN_DELAY_TICKS = 240;

export const SLICE_TEMPLATE_IDS = {
  bridge: 'encounter.slice.unsafe_bridge',
  pass: 'encounter.slice.snow_on_the_pass',
  caravan: 'encounter.slice.riders_behind_caravan',
  crossroads: 'encounter.slice.bargain_at_crossroads',
  fullMoon: 'encounter.slice.full_moon_collection',
  family: 'encounter.slice.swindled_family',
  swindlerFound: 'encounter.slice.swindler_found',
  gratefulKin: 'encounter.slice.grateful_kin',
} as const;

// ═════════════════════════════════════════════════════════════════════
// 1. THE UNSAFE BRIDGE — Single Test (Hook #205)
// ═════════════════════════════════════════════════════════════════════
//
// Crux: the only bridge within a day's walk is failing, and the family that
//       keeps it swears it will hold.
// Shape: Single Test · Setting: wayside · Pressure: fear · Form: collapse ·
// Objective: cross · Stakes: no-penalty (fail → the long ford, exhausted;
// crit-fail → a fall, wounded) · System: movement + conditions ·
// Step: Stone — "Cross the bridge" (weight, footing, nerve).
// Why here: the road crosses here (chance or mission route).
// Connected systems (Q8): conditions ×2, equipment (pack weight as a derived
// line), cards — 3 beyond the core test.
// Choice: none. Promise→payoff: the bridge's true state — the crossing answers.

const BRIDGE_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared focus family, the common option.
    id: 'slice.bridge.sure_feet',
    name: 'Sure Feet',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine: 'You steady their balance, so each plank gets a clean, centered step. A small help.',
    fiction: 'One foot, then the next.',
    bandProse: {
      success: 'Every step landed mid-plank, quiet as counting.',
      near_miss: 'The feet stayed sure. A plank did not return the favor.',
    },
  },
  {
    // Type: Boost — force, acting on the structure instead of the walker.
    id: 'slice.bridge.hold_the_timber',
    name: 'Hold the Timber',
    sphere: 'force',
    essenceCost: 2,
    forecastDelta: 0.1,
    imageTag: 'generic.force',
    effectLine: 'You brace the weakest beam while weight is on it, so the bridge carries more than it should. A real help.',
    fiction: 'What holds, holds.',
    bandProse: {
      success_at_cost: 'The beam held to the far post, then split with a crack like a whip.',
      failure: 'The braced beam held. The plank two ahead of it was the liar.',
      critical_failure: 'The beam held until the worst step of the worst stride, and then it was a trapdoor.',
    },
  },
  {
    // Type: Boost — light, revealing which planks can be trusted.
    id: 'slice.bridge.light_on_the_gaps',
    name: 'Light on the Gaps',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.light',
    effectLine: 'You sharpen the light through the planking, so every gap and soft board shows dark before it is stepped on. A real help.',
    fiction: 'Rot cannot argue with daylight.',
    bandProse: {
      critical_success: 'The bad boards showed grey against the sound ones, a path drawn in plain sight.',
      failure: 'The light showed every gap. It could not show which sound-looking plank had let go below.',
    },
  },
  {
    // Type: Mercy — this hand's ONE rider. Life's gentleness: the river may
    // refuse them, and still hand them back.
    id: 'slice.bridge.small_mercies',
    name: 'Small Mercies',
    sphere: 'life',
    essenceCost: 3,
    forecastDelta: 0.04,
    rider: 'no_crit_fail',
    imageTag: 'generic.balm',
    effectLine: 'Whatever fails tonight, the river gives them back. The worst end is taken off the table.',
    fiction: 'Not every fall is a sentence.',
    bandProse: {
      failure: 'The bridge refused them halfway, and the water took them gently to the shallows.',
    },
  },
  {
    // Type: Boost — time, slowing the crossing to the bridge's own pace.
    id: 'slice.bridge.patient_steps',
    name: 'Patient Steps',
    sphere: 'time',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.time',
    effectLine: 'You stretch their patience, so the crossing takes the slow minute it needs instead of the fast one fear wants. A small, steady help.',
    fiction: 'Hurry is the heaviest load.',
    bandProse: {
      near_miss: 'They took it slow, and slow got them across everything except the last board.',
      failure: 'Patience carried them to the middle span, and the middle span was where the bridge ran out of patience.',
    },
  },
];

const BRIDGE_STEP: ActionStep = {
  reach: 'stone',
  duration: { min: 1, max: 2 },
  difficulty: 0.4,
  purposeLine: 'Cross the bridge',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The nails have risen out of the grey planking. The handrail stops an arm short of the ' +
    'far bank. Under the middle span, water moves through a gap where a timber used to be. ' +
    'The traveler’s pack drags at the shoulders even standing still. The keeper waits, ' +
    'hand open on the strongbox.',
  successAfterimage: 'They crossed slow and even, and the bridge held its tongue.',
  failureAfterimage: 'The bridge turned them back at the middle span, and the long ford ate half the day.',
  successAtCostAfterimage: 'They made the far bank as a plank went into the river behind them.',
  criticalSuccessAfterimage: 'They read the boards right and crossed as if the bridge were new.',
  criticalFailureAfterimage: 'A beam gave under their full weight, and and the fall cost them a hard year.',
  nudges: BRIDGE_HAND,
};

export const SLICE_UNSAFE_BRIDGE: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.bridge,
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'The Unsafe Bridge',
  reach: 'stone',
  crudType: 'read',
  scale: 'local',
  steps: [BRIDGE_STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  settings: ['wayside'],
  openings: {
    wayside:
      'The bridge sags where the river runs deepest. The river is loud under it, and the air ' +
      'off the water is cold. At a table by the near post sits the keeper, a woman with a ' +
      'strongbox, and behind her two grown sons who do not look at the planking. “It ' +
      'holds,” she says, before the traveler can ask. “Two coppers. Or the ford is ' +
      'half a day upstream, if you like wet boots.”',
  },
  locationSubtypes: expandSettings(['wayside']),
  traitVariants: [
    {
      // Being True, they will not pretend the bridge is better than it looks —
      // and an honest eye on bad planking is worth more than a brave one.
      traitId: 'trait.core.core_integrity.virtue',
      forecastDelta: 0.04,
      factorLine: 'Being True, they judge the boards as they are.',
    },
  ],
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The river keeps moving under the bridge, and the keeper keeps taking coppers. ' +
        'Every crossing is a vote on how long that lasts.',
      changes: [],
      reactions: [
        {
          id: 'slice.bridge.walk_on',
          label: 'Walk on',
          intent: 'The road goes on from either bank.',
          effects: [],
        },
      ],
    },
  },
  narrativeTemplates: {
    initiation:
      'The road meets the river at a bridge that has seen better decades, and the toll is ' +
      'cheaper than the detour.',
    success: 'The bridge held, and the road goes on from the far bank.',
    failure: 'The bridge could not be trusted, and the long ford cost the rest of the day.',
  },
  description:
    'Single Test (Hook #205): cross a failing toll bridge or lose half a day to the ford. ' +
    'Vertical-slice encounter, THR-883.',
};

// ═════════════════════════════════════════════════════════════════════
// 2. SNOW ON THE PASS — Test & Consequence (Hook: original)
// ═════════════════════════════════════════════════════════════════════
//
// Crux: snow is coming to the pass, and the traveler is on the wrong side of it.
// Shape: Test & Consequence · Setting: wayside · Pressure: weather · Form:
// endure · Objective: survive · Stakes: no-penalty (a bad night costs
// exhaustion; a terrible one costs days) · System: movement + carryover +
// conditions + items · Steps: Stone "Beat the snow" → Stone "Pass the night",
// tilted by the carryover (THR-892 carryoverFactorLines — the slice's live use).
// Connected systems (Q8): carryover, conditions ×2 (incl. a Balm target),
// equipment (boots/cloak derived lines), cards — 4 beyond the core test.
// Choice: none. Promise→payoff: the lowering sky delivers the storm; the
// night is the consequence.

const PASS_CLIMB_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared strength family, the common option.
    id: 'slice.pass.second_wind',
    name: 'Second Wind',
    essenceCost: 1,
    forecastDelta: 0.1,
    imageTag: 'generic.strength',
    effectLine: 'When the legs go dead on the switchbacks, the body finds one more climb. A real help.',
    fiction: 'The body keeps a reserve the mind never meets.',
    bandProse: {
      success: 'The last switchback went by on legs that had no right to it.',
      failure: 'There was one more climb in them. The mountain asked for two.',
    },
  },
  {
    // Type: Boost — life, warmth held in the blood.
    id: 'slice.pass.warm_blood',
    name: 'Warm Blood',
    sphere: 'life',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.balm',
    effectLine: 'You keep the warmth in their hands and feet, so the cold cannot slow the climb before the snow does. A real help.',
    fiction: 'Cold takes the fingers first, and the will second.',
    bandProse: {
      success_at_cost: 'The warmth held to the saddle. It spent them to their last dry layer doing it.',
      near_miss: 'Warm hands got them high and fast, and the snow was faster.',
    },
  },
  {
    // Type: Boost — force, the wind turned aside.
    id: 'slice.pass.break_the_wind',
    name: 'Break the Wind',
    sphere: 'force',
    essenceCost: 2,
    forecastDelta: 0.09,
    imageTag: 'generic.force',
    effectLine: 'You blunt the north wind on the exposed stretches, so the climb spends its strength on climbing. A real help.',
    fiction: 'The wind is the mountain’s first argument.',
    bandProse: {
      critical_success: 'The wind stood off the whole climb, and the saddle came early.',
      failure: 'The wind was held. The light was not, and the last stretch went dark.',
    },
  },
  {
    // Type: Boost — light, the day stretched thin.
    id: 'slice.pass.last_light',
    name: 'Last Light',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.light',
    effectLine: 'You hold the grey light past its hour, so the trail stays readable to the top. A real help.',
    fiction: 'Dusk keeps its own schedule. Usually.',
    bandProse: {
      near_miss: 'The light lasted. The trail under it was already filling in.',
      critical_failure: 'The light held long enough to show exactly how far below the saddle the snow caught them.',
    },
  },
  {
    // Type: Boost — time, a pace that does not break.
    id: 'slice.pass.even_pace',
    name: 'Even Pace',
    sphere: 'time',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.time',
    effectLine: 'You settle their stride to a climber’s clock, so the slope is spent evenly instead of in bursts. A small, steady help.',
    fiction: 'Mountains are climbed at one speed.',
    bandProse: {
      success: 'The pace never broke, and the saddle arrived on schedule.',
      failure: 'The pace was right for a longer day than this one turned out to be.',
    },
  },
];

const PASS_NIGHT_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared focus family, the common option.
    id: 'slice.pass.steady_breath',
    name: 'Steady Breath',
    essenceCost: 1,
    forecastDelta: 0.05,
    imageTag: 'generic.focus',
    effectLine: 'You slow the fear, so the night is spent on the work of staying warm instead of the work of worrying. A small help.',
    fiction: 'Breathe once. Then look again.',
    bandProse: {
      failure: 'The nerve held all night. The wood did not.',
    },
  },
  {
    // Type: Boost — energy, the fire that will not quit.
    id: 'slice.pass.banked_heat',
    name: 'Banked Heat',
    sphere: 'energy',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.ember',
    effectLine: 'You keep the coals alive through the worst hour, so the fire is an ally and never a chore. A real help.',
    fiction: 'A banked fire is a promise kept till morning.',
    bandProse: {
      success: 'The coals held a red heart all night, and morning found it still beating.',
      failure: 'The coals were kept alive. The night was longer than the woodpile.',
    },
  },
  {
    // Type: Balm — life; the day's exhaustion lifted before the night tests it.
    id: 'slice.pass.deep_rest',
    name: 'Deep Rest',
    sphere: 'life',
    essenceCost: 2,
    forecastDelta: 0.06,
    imageTag: 'generic.balm',
    grants: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.exhausted' }],
    effectLine: 'The climb’s weariness lifts, so the night starts on a rested body, with the exhaustion lifted.',
    fiction: 'Rest is armor.',
    bandProse: {
      near_miss: 'The rest was real. The cold that followed it was more real.',
    },
  },
  {
    // Type: Boost — matter, shelter made stubborn.
    id: 'slice.pass.iron_patience',
    name: 'Iron Patience',
    sphere: 'matter',
    essenceCost: 2,
    forecastDelta: 0.07,
    imageTag: 'generic.stonework',
    effectLine: 'You stiffen whatever stands between them and the wind, so the shelter holds its shape till dawn. A real help.',
    fiction: 'Stone does not complain about weather.',
    bandProse: {
      success_at_cost: 'The shelter held its shape. Holding it cost the night’s sleep in repairs.',
      critical_failure: 'The shelter held to the exact hour the storm found its second strength.',
    },
  },
  {
    // Type: Boost — darkness, the night made a blanket instead of a threat.
    id: 'slice.pass.quiet_dark',
    name: 'Quiet Dark',
    sphere: 'darkness',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.dark',
    effectLine: 'You still the dark around the camp, so nothing in it costs them sleep or nerve. A small help.',
    fiction: 'Some nights the dark is on your side.',
    bandProse: {
      critical_success: 'The night passed like a held breath, and dawn came kind.',
      failure: 'The dark stayed quiet. The cold did all the talking.',
    },
  },
];

const PASS_CLIMB_STEP: ActionStep = {
  reach: 'stone',
  duration: { min: 1, max: 2 },
  difficulty: 0.42,
  purposeLine: 'Beat the snow',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'It is a plain race. The hut under the saddle has a roof, a hearth, and stacked wood old ' +
    'as the road; the slope below it has scrub, hollows, and wind. The first switchback ' +
    'starts wet and gets steep, and the light is going.',
  successAfterimage: 'They made the saddle ahead of the snow, and the hut door shut behind them.',
  failureAfterimage: 'The snow caught them below the saddle, and the night would be spent in the open.',
  successAtCostAfterimage: 'They reached the hut spent to the bone, the first drifts at their heels.',
  criticalSuccessAfterimage: 'They beat the storm with light to spare and wood already split.',
  criticalFailureAfterimage: 'The storm came down the slope to meet them, and the climb ended where it stood.',
  nudges: PASS_CLIMB_HAND,
};

const PASS_NIGHT_STEP: ActionStep = {
  reach: 'stone',
  duration: { min: 1, max: 2 },
  difficulty: 0.38,
  purposeLine: 'Pass the night',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  // THR-892 carryover lines — the variance rule's one authored factor surface
  // besides trait lines. The night reads how the climb went.
  carryoverFactorLines: {
    critical_success: {
      text: 'The hut is warm, the wood dry, the storm outside.',
      polarity: 'for',
      forecastDelta: 0.08,
    },
    success: {
      text: 'A roof and a hearth stand between them and the snow.',
      polarity: 'for',
      forecastDelta: 0.06,
    },
    success_at_cost: {
      text: 'The hut holds them, but the climb took their last dry strength.',
      polarity: 'for',
      forecastDelta: 0.02,
    },
    near_miss: {
      text: 'Caught short of the saddle, they make camp in the scrub.',
      polarity: 'against',
    },
    failure: {
      text: 'The night finds them on open slope with wet kindling.',
      polarity: 'against',
      forecastDelta: -0.06,
    },
    critical_failure: {
      text: 'The storm broke over them mid-climb, and camp is wherever they fell.',
      polarity: 'against',
      forecastDelta: -0.1,
    },
  },
  narrativeTemplate:
    'The snow arrives as a wall of small dry flakes that do not stop. The wind takes the ' +
    'temperature down with the light. From here to morning, the work is heat: making it, ' +
    'keeping it, and not spending it on fear.',
  successAfterimage: 'Morning came grey and quiet, and they walked down the far side stiff and whole.',
  failureAfterimage: 'The night took more than it gave back, and the morning legs knew it.',
  successAtCostAfterimage: 'They passed the night awake and paid for it in the next day’s miles.',
  criticalSuccessAfterimage: 'They slept warm through the worst of it and woke to a pass already clearing.',
  criticalFailureAfterimage: 'The storm held them two days, and the mountain fed them poorly the whole stay.',
  nudges: PASS_NIGHT_HAND,
};

export const SLICE_SNOW_ON_THE_PASS: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.pass,
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'Snow on the Pass',
  reach: 'stone',
  crudType: 'read',
  scale: 'local',
  steps: [PASS_CLIMB_STEP, PASS_NIGHT_STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  settings: ['wayside'],
  openings: {
    wayside:
      'The snow line on the peaks has come down a hand since morning, and the wind has gone ' +
      'around to the north. The pass hut sits just under the saddle, a half day’s climb up ' +
      'switchbacks the traveler can see from here. Behind them, the last village is a day ' +
      'back the wrong direction. The first flakes are small and dry and do not melt on the sleeve.',
  },
  locationSubtypes: expandSettings(['wayside']),
  traitVariants: [
    {
      // Hope reads the hut as reachable, and reachable things get reached.
      traitId: 'trait.core.core_hope.virtue',
      forecastDelta: 0.04,
      factorLine: 'Hopeful, they climb toward the hut and never the storm.',
    },
  ],
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The pass stays open behind them or closes for the season, and in both tellings the ' +
        'mountain keeps the toll it took.',
      changes: [],
      reactions: [
        {
          id: 'slice.pass.walk_down',
          label: 'Walk down the far side',
          intent: 'The road resumes below the snow line.',
          effects: [],
        },
      ],
    },
  },
  narrativeTemplates: {
    initiation: 'The pass is a half day up, and the weather is a half day behind.',
    success: 'They crossed ahead of the season and came down the far side whole.',
    failure: 'The mountain kept them longer than planned and charged for the stay.',
  },
  description:
    'Test & Consequence (original): beat the snow to the pass hut, then pass the night on ' +
    'whatever ground the race left. Carryover demo. Vertical-slice encounter, THR-883.',
};

// ═════════════════════════════════════════════════════════════════════
// 3. RIDERS BEHIND THE CARAVAN — Puzzle–Investigation–Resolution (Hook #207)
// ═════════════════════════════════════════════════════════════════════
//
// Crux: riders are trailing the traveler's caravan, hunting one of the
//       thirty — and they will take everyone to reach them.
// Shape: Puzzle–Investigation–Resolution · Setting: wayside · Pressure: fear ·
// Form: hunt · Objectives: the master protects; the hunted conceals; the
// agent must solve · Stakes: intel + no-penalty; a seed either way (v1: the
// close stays in-encounter; the chain slot is reserved) · System: cards +
// traits + movement; intel flagged middling.
// The clues live BEHIND the Eye gate: the bands of step 1 reveal them
// (who avoids the riders' side of the road, whose gear argues with their
// story, who overpays for silence) — the opening promises and does not tell.
// Why the agent: they joined the column last and knew no one in it before —
// scene-local fact of this journey, stated in the master's own dialogue.
// Connected systems (Q8): traits (variant + trait factor), conditions
// (terrified on a bad end), cards, movement — 3+ beyond the core test.
// Choice: none. Promise→payoff: who is hunted → step-1 bands; who hunts →
// step 2 and the aftermath.

const CARAVAN_FIND_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared focus family, the common option.
    id: 'slice.caravan.quiet_questions',
    name: 'Quiet Questions',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.focus',
    effectLine: 'You settle the asking, so every question lands as small talk and never as suspicion. A small help.',
    fiction: 'The best questions do not sound like questions.',
    bandProse: {
      success: 'By the third fire, the column’s stories had come loose.',
      near_miss: 'The questions stayed gentle. One answer came back too smooth to trust.',
    },
  },
  {
    // Type: Boost — mind, the details lined up and compared.
    id: 'slice.caravan.old_lessons',
    name: 'Old Lessons',
    sphere: 'mind',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.memory',
    effectLine: 'You surface every road-story they have ever heard told wrong, so the false one in this column stands out. A real help.',
    fiction: 'No river is the first river.',
    bandProse: {
      success_at_cost: 'The wrong story showed itself. So did the traveler’s interest in it.',
      failure: 'Every story in the column had a crack in it. Roads do that to stories.',
    },
  },
  {
    // Type: Gambit — chaos, this hand's ONE rider: shake the column and watch.
    id: 'slice.caravan.a_loose_tongue',
    name: 'A Loose Tongue',
    sphere: 'chaos',
    essenceCost: 1,
    forecastDelta: 0.04,
    rider: 'all_or_nothing',
    imageTag: 'generic.gambit',
    effectLine: 'You loosen one voice at the night fire — the truth spills fast, or the hunt is tipped off. The middle drops away.',
    fiction: 'A shaken cup shows what settles.',
    bandProse: {
      critical_success: 'The loose talk ran one direction all night, and it pooled around a single bedroll.',
      failure: 'The talk ran loose and useless, and by morning the column knew a question was loose in it.',
      critical_failure: 'The wrong ears caught the loose talk, and on the ridge the riders changed their pace.',
    },
  },
  {
    // Type: Boost — matter, what people carry telling on them.
    id: 'slice.caravan.marked_coin',
    name: 'Marked Coin',
    sphere: 'matter',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.coin',
    effectLine: 'You draw the eye to what things are worth against what their owners claim to be, so the gear tells on the story. A real help.',
    fiction: 'A pack always inventories its owner.',
    bandProse: {
      near_miss: 'One kit argued with its owner’s story. So, on a second look, did two others.',
      failure: 'Everyone on a long road carries one item above their station. The trick points at half the column.',
    },
  },
  {
    // Type: Boost — time, the pattern across four days of road.
    id: 'slice.caravan.patient_watch',
    name: 'Patient Watch',
    sphere: 'time',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.time',
    effectLine: 'You hold the whole four days in view at once, so the one walker whose habits bend around the riders shows plain. A real help.',
    fiction: 'People repeat. Watch long enough.',
    bandProse: {
      success: 'Across four days, one walker never once let the ridge see their face.',
      critical_failure: 'The pattern came clear a half day too late to matter.',
    },
  },
];

const CARAVAN_SLIP_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared focus family, the common option.
    id: 'slice.caravan.hushed_steps',
    name: 'Hushed Steps',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.focus',
    effectLine: 'You steady the leaving, so it looks like an errand and sounds like sleep. A small help.',
    fiction: 'The quietest departures are boring ones.',
    bandProse: {
      success: 'Two shapes left the camp at the hour when nobody counts shapes.',
      near_miss: 'The leaving was quiet. The dog that watched it leave was not.',
    },
  },
  {
    // Type: Boost — darkness, cover for the leaving.
    id: 'slice.caravan.thicken_the_dark',
    name: 'Thicken the Dark',
    sphere: 'darkness',
    essenceCost: 2,
    forecastDelta: 0.1,
    imageTag: 'generic.dark',
    effectLine: 'You deepen the dark between the fires and the treeline, so the going is a rumor even to the watch. A real help.',
    fiction: 'The dark keeps what it is given.',
    bandProse: {
      critical_success: 'The dark held them the whole distance, and the morning count came up one short with no story attached.',
      failure: 'The dark covered the leaving. It covered the ditch as well.',
    },
  },
  {
    // Type: Boost — mind, the story that survives the morning after.
    id: 'slice.caravan.a_plain_story',
    name: 'A Plain Story',
    sphere: 'mind',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.memory',
    effectLine: 'You seed a dull, sensible reason for the empty bedroll, so the morning asks no questions worth carrying to the riders. A real help.',
    fiction: 'A good lie is a boring one.',
    bandProse: {
      success_at_cost: 'The story held with the column. Holding it cost the master a debt he will remember.',
      failure: 'The story was plain. The empty bedroll was plainer.',
    },
  },
  {
    // Type: Insurance — order, this hand's ONE rider: the leaving is bought.
    id: 'slice.caravan.safe_passage',
    name: 'Safe Passage',
    sphere: 'order',
    essenceCost: 3,
    forecastDelta: 0.05,
    rider: 'floor_at_cost',
    imageTag: 'generic.ward',
    effectLine: 'However the night goes, the hunted one is out of the column by morning. The price, if it comes due, is paid in noise and hours.',
    fiction: 'Arrive first. Count the cost after.',
    bandProse: {
      success_at_cost: 'They got clear because getting clear had been arranged twice over. The second arrangement was loud.',
      critical_failure: 'The route out held. What it opened onto had riders already on it.',
    },
  },
  {
    // Type: Boost — spirit, two nerves held as one.
    id: 'slice.caravan.one_heartbeat',
    name: 'One Heartbeat',
    sphere: 'spirit',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.bond',
    effectLine: 'You knit the traveler’s nerve to the hunted one’s, so neither can panic without the other steadying it. A small, steady help.',
    fiction: 'Two afraid together are braver than one.',
    bandProse: {
      near_miss: 'Neither of them broke. The horse they had counted on did.',
      failure: 'The nerve held in both of them right up to the open ground.',
    },
  },
];

const CARAVAN_FIND_STEP: ActionStep = {
  reach: 'eye',
  duration: { min: 1, max: 2 },
  difficulty: 0.4,
  purposeLine: 'Find the hunted',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    '“You joined us last, and you knew none of us before. That makes you the only walker ' +
    'I can rule out.” He keeps his eyes on the oxen while he says it. He wants a name ' +
    'before the town gates, and he wants the column not to know it is being weighed.',
  successAfterimage: 'By the third night fire, the traveler knew which bedroll the riders were waiting on.',
  failureAfterimage: 'Four days of watching bought suspicions, and the gates arrived before certainty did.',
  successAtCostAfterimage: 'The name came clear, and so did a rumor that questions were being asked.',
  criticalSuccessAfterimage: 'The traveler found the hunted one early, and found them ready to talk.',
  criticalFailureAfterimage: 'The watching was noticed, and the column began watching back.',
  nudges: CARAVAN_FIND_HAND,
};

const CARAVAN_SLIP_STEP: ActionStep = {
  reach: 'shadow',
  duration: { min: 1, max: 2 },
  difficulty: 0.42,
  purposeLine: 'Slip them out',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  carryoverFactorLines: {
    critical_success: {
      text: 'The hunted one trusts the traveler and moves on their word.',
      polarity: 'for',
      forecastDelta: 0.06,
    },
    success: {
      text: 'The right name is known, and the leaving can be planned.',
      polarity: 'for',
      forecastDelta: 0.04,
    },
    near_miss: {
      text: 'The name is a strong guess, and guesses leave at night too.',
      polarity: 'against',
    },
    failure: {
      text: 'No certain name — the plan protects a hope, not a person.',
      polarity: 'against',
      forecastDelta: -0.05,
    },
    critical_failure: {
      text: 'The column is wary now, and wary camps sleep lightly.',
      polarity: 'against',
      forecastDelta: -0.08,
    },
  },
  narrativeTemplate:
    'The last camp before the gates sits in a river bend, fires low, the ridge dark and not ' +
    'empty. Whoever leaves the column has to leave tonight, quietly, and in a direction the ' +
    'riders have not thought to own yet.',
  successAfterimage: 'The morning count came up one short, and the column walked through the gates unbothered.',
  failureAfterimage: 'The leaving failed, and the column reached the gates with the riders still choosing their hour.',
  successAtCostAfterimage: 'The hunted one got clear, and the noise of it will be paid for in the town.',
  criticalSuccessAfterimage: 'By dawn the hunted one was a day gone on a road with no watchers, and the riders were following a cart that mattered to no one.',
  criticalFailureAfterimage: 'The riders came down off the ridge at the worst hour, and the camp woke to shouting.',
  nudges: CARAVAN_SLIP_HAND,
};

export const SLICE_RIDERS_BEHIND_CARAVAN: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.caravan,
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'Riders Behind the Caravan',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',
  steps: [CARAVAN_FIND_STEP, CARAVAN_SLIP_STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['revelation_discretion', 'sacrifice_survival'],
  settings: ['wayside'],
  openings: {
    wayside:
      'The caravan is strung out along a chalk road between hedges, oxen slow in the heat, ' +
      'dust on everyone’s teeth. On the ridge behind, two riders have kept pace since ' +
      'noon — out of hail, in no hurry. Four days short of the next walled town, the ' +
      'caravan master drops back to walk beside the traveler. “Somebody in my column is ' +
      'being hunted,” he says. “Those two are waiting, and when they stop waiting ' +
      'they will not be polite about the other twenty-nine of us.”',
  },
  locationSubtypes: expandSettings(['wayside']),
  traitVariants: [
    {
      // Warmth opens doors that questions cannot.
      traitId: 'trait.core.core_warmth.virtue',
      forecastDelta: 0.05,
      factorLine: 'Warm company makes the column talk to them freely.',
    },
  ],
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The gates take the column in, one walker lighter or one secret heavier, and the ' +
        'riders on the ridge make their own arithmetic about it.',
      changes: [],
      reactions: [
        {
          id: 'slice.caravan.part_ways',
          label: 'Part ways at the gates',
          intent: 'The column scatters into the town, and the road resumes.',
          effects: [],
        },
      ],
    },
  },
  narrativeTemplates: {
    initiation: 'Two riders have kept pace with the caravan since the river, and they are not lost.',
    success: 'The caravan reached the gates whole, and the hunt went home empty.',
    failure: 'The hunt closed on the column before the gates could.',
  },
  description:
    'Puzzle–Investigation–Resolution (Hook #207): find which of thirty travelers is ' +
    'hunted, then get them out of the column unseen. Vertical-slice encounter, THR-883.',
};

// ═════════════════════════════════════════════════════════════════════
// 4. A BARGAIN AT THE CROSSROADS — Personality Fork (Hook #206)
//    └─ seeds THE FULL MOON COLLECTION on the accept path
// ═════════════════════════════════════════════════════════════════════
//
// Crux: a stranger at the crossroads knows the traveler's name and offers a
//       gift that costs only a promise.
// Shape: Personality Fork on tradition↔novelty — positive (Archivist) keeps
// their word to themselves and walks on; negative (Heretic) gives the promise
// and takes the bargain · Setting: wayside · Pressure: ambition · Form:
// bargain · Objective: negotiate or refuse · Stakes: seed (the full-moon
// sequel) on accept; no-penalty on refusal · System: forks + seeds; the
// arcane is scene flavor only — no agent-magic mechanics.
// Personalization (Q8): the stranger greets by name (narrated; the name-token
// surface is the ticketed gap); the gift glimpse is authored generic in v1
// and keyed to the agent in the same ticket. Connected systems: forks, seeds,
// traits (variant), cards — 3+ beyond the core test.
// Promise→payoff: what the man is — deliberately deferred into the seeded
// sequel; the Eye step's bands give partial truth only.

const CROSSROADS_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — common; the old tales as a measuring stick. Leans toward
    // keeping one's word to oneself (tradition).
    id: 'slice.crossroads.old_stories',
    name: 'Old Stories',
    essenceCost: 1,
    forecastDelta: 0.06,
    poleLean: { axis: 'tradition_novelty', toward: 'positive' },
    imageTag: 'generic.memory',
    effectLine: 'You surface every fireside tale about crossroads strangers, so the offer is weighed against all of them. A small help, and it argues for walking on.',
    fiction: 'The old stories agree on crossroads.',
    bandProse: {
      success: 'The tales lined up beside the stranger, and the fit was close enough to notice.',
      near_miss: 'The tales said walk on. The named gift said the tales had never been this specific.',
    },
  },
  {
    // Type: Boost — mind, reading the man as a man.
    id: 'slice.crossroads.second_sight',
    name: 'Second Sight',
    sphere: 'mind',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.insight',
    effectLine: 'You sharpen their read of him — the hands, the coat, the patience — so whatever he is, less of it stays hidden. A real help.',
    fiction: 'Every mask fits badly at the edges.',
    bandProse: {
      success: 'The read came back strange and shallow at once: fine boots that had walked no road, patience with no fidget in it.',
      failure: 'The read slid off him like water off wax.',
    },
  },
  {
    // Type: Kindled Ambition — spirit; the wanting itself, examined. Leans
    // toward taking the bargain (novelty).
    id: 'slice.crossroads.a_taste_for_wonders',
    name: 'A Taste for Wonders',
    sphere: 'spirit',
    essenceCost: 1,
    forecastDelta: 0.07,
    poleLean: { axis: 'tradition_novelty', toward: 'negative' },
    imageTag: 'generic.spark',
    effectLine: 'You fan the wanting the stranger named, so the choice is made with open eyes about how much it is wanted. A small help, and it argues for the bargain.',
    fiction: 'Wanting is not a fault. Pretending not to want is.',
    bandProse: {
      near_miss: 'The wanting stood up honestly, and honesty made it harder, not easier.',
      failure: 'The wanting grew loud enough to drown the part of the read that mattered.',
    },
  },
  {
    // Type: Boost — time; what the full moon means, counted forward.
    id: 'slice.crossroads.cold_reading',
    name: 'Cold Reading',
    sphere: 'time',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.time',
    effectLine: 'You count the promise forward — where the road leads, where the moon finds it — so the price is measured in days, and days are real. A real help.',
    fiction: 'Every promise has a calendar.',
    bandProse: {
      critical_success: 'The whole bargain unfolded like a route on a map: the gift, the moon, the walk back, the standing still.',
      failure: 'The days counted forward cleanly, and stopped counting at the full moon like a road stopping at a cliff.',
    },
  },
  {
    // Type: Boost — light; the plain look that embarrasses glamours.
    id: 'slice.crossroads.truthful_air',
    name: 'Truthful Air',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.07,
    imageTag: 'generic.light',
    effectLine: 'You clear the evening air around him, so what stands at the crossroads is seen in honest light, whatever it is. A real help.',
    fiction: 'Good light is the oldest test.',
    bandProse: {
      success_at_cost: 'The honest light showed a man-shaped patience, and showed the traveler how long it had been standing there.',
      critical_failure: 'The air cleared, and for one look there was slightly too much crossroads and slightly too little man.',
    },
  },
];

const CROSSROADS_MEASURE_STEP: ActionStep = {
  reach: 'eye',
  duration: { min: 1, max: 1 },
  difficulty: 0.35,
  purposeLine: 'Take his measure',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The road east goes past him, open. He states his terms like a merchant at a stall: the ' +
    'offer stands, now or at the full moon, spoken of or not. A crow leaves the dead tree ' +
    'and does not come back. Give a word to a stranger who knows too much, or keep it and ' +
    'keep walking.',
  successAfterimage: 'The traveler took the stranger’s measure and kept their own counsel about it.',
  failureAfterimage: 'The stranger measured easier than he read, and gave back only manners.',
  successAtCostAfterimage: 'The reading told them truths they would have preferred to learn from further away.',
  criticalSuccessAfterimage: 'For one clear look, the traveler saw the shape of the bargain whole.',
  criticalFailureAfterimage: 'The look went wrong behind the eyes, and the crossroads kept the answer.',
  nudges: CROSSROADS_HAND,
};

/** Accept path — the promise given; the full moon is now a fact of the calendar. */
const CROSSROADS_ACCEPT_STEP: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 1 },
  difficulty: 0.2,
  purposeLine: 'Give the word',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The word is short to say and heavy to carry. The stranger accepts it with a nod, as if ' +
    'signing for a delivery, and steps back under the dead tree. “The moon will find ' +
    'you,” he says. “It is better at that than I am.”',
  successAfterimage: 'The promise was given plainly, and the stranger treated it like currency.',
  failureAfterimage: 'The word came out hedged, and the stranger accepted the hedge with a smile that said it did not matter.',
  successAtCostAfterimage: 'The promise was given, and giving it cost a night’s easy sleep.',
  criticalSuccessAfterimage: 'The word was given clean, and for a heartbeat the crossroads felt like a signed ledger.',
  criticalFailureAfterimage: 'The promise left the traveler’s mouth and did not feel like theirs anymore.',
};

/** Refuse path — the word kept; the road taken. */
const CROSSROADS_REFUSE_STEP: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 1 },
  difficulty: 0.2,
  purposeLine: 'Keep the word',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The traveler keeps their word where it lives and walks. The stranger does not follow ' +
    'and does not frown. “A careful answer,” he says behind them, in the voice of a ' +
    'man closing a shop for the evening. The crossroads drops behind them at the treeline like any other stretch of road.',
  successAfterimage: 'They walked on with their word unspent, and the road stayed ordinary.',
  failureAfterimage: 'They walked on, and the offer walked with them for a mile or two before it faded.',
  successAtCostAfterimage: 'They refused him plainly, and spent the evening rehearsing the refusal.',
  criticalSuccessAfterimage: 'The refusal cost them not one copper, which was its own quiet answer about the man.',
  criticalFailureAfterimage: 'They refused, and the wanting he had named kept them company far past the treeline.',
};

const CROSSROADS_FORK: ActionStepBranch = {
  branchOnStep: 0,
  decidedBy: { axis: 'tradition_novelty' },
  variants: {
    positive: CROSSROADS_REFUSE_STEP,
    negative: CROSSROADS_ACCEPT_STEP,
  },
  fallback: CROSSROADS_REFUSE_STEP,
};

export const SLICE_BARGAIN_AT_CROSSROADS: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.crossroads,
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'A Bargain at the Crossroads',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',
  steps: [CROSSROADS_MEASURE_STEP, CROSSROADS_FORK],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['tradition_novelty'],
  settings: ['wayside'],
  openings: {
    wayside:
      'The crossroads has a stone marker and a dead tree, and under the tree stands a tall ' +
      'man in a clean coat. No horse, no pack, no mud on his boots. The evening wind moves ' +
      'everything at the crossroads except him. He greets the traveler by name. He offers a ' +
      'gift, to be collected here at the next full moon, and the price is only a promise to ' +
      'come and take it. Then he describes the gift — and it lands close to the ' +
      'traveler’s own quiet wanting, or he is guessing well.',
  },
  locationSubtypes: expandSettings(['wayside']),
  traitVariants: [
    {
      // A True mortal treats a promise as a real object before giving one away.
      traitId: 'trait.core.core_integrity.virtue',
      forecastDelta: 0.04,
      factorLine: 'Being True, they weigh the promise as carefully as the gift.',
    },
  ],
  aftermathConfig: {
    // The *deciding* step, not the fork's own index (THR-979). CROSSROADS_FORK
    // sits at index 1 but declares `branchOnStep: 0`, and the engine records the
    // decision against the step that resolved — index 0. Naming 1 here read a
    // step no choice is ever written to, so both endings below were unreachable
    // and the Full Moon seed was never planted.
    branchOnStep: 0,
    variants: {
      negative: {
        overview:
          'The bargain is struck. The stranger folds back into the evening like a ledger ' +
          'closing, and the full moon is already on the calendar.',
        changes: [],
        reactions: [
          {
            id: 'slice.crossroads.carry_the_promise',
            label: 'Carry the promise',
            intent: 'The road goes on, with an appointment at the end of it.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: SLICE_TEMPLATE_IDS.fullMoon,
                targetAgentId: '$actor',
                delayTicks: SLICE_FULL_MOON_DELAY_TICKS,
                seedLabel: 'A promise made at the crossroads falls due at the full moon.',
                inheritContext: true,
              },
            ],
          },
        ],
      },
      positive: {
        overview:
          'The offer was real, and so was the refusal. The road east keeps its ordinary ' +
          'evening, which suddenly counts for more than it did this morning.',
        changes: [],
        reactions: [
          {
            id: 'slice.crossroads.walk_on',
            label: 'Walk on',
            intent: 'An unspent word weighs less with every mile.',
            effects: [],
          },
        ],
      },
    },
    fallback: {
      overview: 'The crossroads empties as crossroads do, one road at a time.',
      changes: [],
      reactions: [
        {
          id: 'slice.crossroads.move_along',
          label: 'Move along',
          intent: 'The treeline takes the road back.',
          effects: [],
        },
      ],
    },
  },
  narrativeTemplates: {
    initiation: 'A stranger at the crossroads knows the traveler’s name, and has an offer priced in promises.',
    success: 'The crossroads was left behind on the traveler’s own terms.',
    failure: 'The crossroads kept more of the evening than it gave back.',
  },
  description:
    'Personality Fork (Hook #206): the mortal decides, by who they are and the god’s ' +
    'lean, whether an uncanny bargain is taken. The accept path seeds The Full Moon ' +
    'Collection. Vertical-slice encounter, THR-883.',
};

// ═════════════════════════════════════════════════════════════════════
// 4b. THE FULL MOON COLLECTION — Seeded Sequel of the crossroads bargain
// ═════════════════════════════════════════════════════════════════════
//
// Crux: the promise made at the crossroads falls due tonight.
// Shape: Seeded Sequel (Single Test) · Setting: wayside · Pressure: oath ·
// Form: fulfil · Objective: fulfil · Stakes: item (the gift is real —
// spawn_artifact, category talisman, runtime-picked so no id can rot) ·
// System: seeds (closing), items, movement.
// Prose rule 7: this scene MAY reference the crossroads and the promise —
// the parent minted both, and this template only ever fires from its seed.
// Promise→payoff: the parent's "what is he?" pays what it can here — and
// pays it the way the tales would: politely, and not entirely.

const FULL_MOON_STEP: ActionStep = {
  reach: 'star',
  duration: { min: 1, max: 1 },
  difficulty: 0.3,
  purposeLine: 'Keep the appointment',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The full moon finds the traveler on open road, as promised. The stranger is there ' +
    'before the light finishes arriving, same coat, same clean boots, holding a wrapped ' +
    'parcel the size of his promise. “You kept it,” he says, pleased, ' +
    'as if promises were coin and this one had held its value. All that remains is to take ' +
    'the gift from his hands.',
  successAfterimage: 'The gift changed hands under the full moon, and the stranger bowed like a merchant after a fair sale.',
  failureAfterimage: 'The parcel passed to the traveler’s hands cold and heavier than it looked.',
  successAtCostAfterimage: 'The gift was given, and with it one more sentence than the traveler wanted to hear.',
  criticalSuccessAfterimage: 'The gift was everything he had described, and he left the moonlight first, which the tales say means the debt is closed for good.',
  criticalFailureAfterimage: 'The gift was real, and so was the look he gave the traveler after — the look of a man updating a ledger.',
};

export const SLICE_FULL_MOON_COLLECTION: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.fullMoon,
  rarityTier: 3,
  intrinsicTier: 'background',
  name: 'The Full Moon Collection',
  reach: 'star',
  crudType: 'read',
  scale: 'local',
  steps: [FULL_MOON_STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['tradition_novelty'],
  settings: ['wayside'],
  openings: {
    wayside:
      'The moon comes up full over the road, and the road remembers. Wherever the traveler ' +
      'meant to be tonight, the crossroads promise has walked with them the whole month, and ' +
      'tonight it stops walking.',
  },
  locationSubtypes: expandSettings(['wayside']),
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The promise is spent and the gift is real. What the stranger banks in kept ' +
        'promises, and what he buys with them, stays his side of the ledger.',
      changes: [],
      reactions: [
        {
          id: 'slice.fullmoon.take_the_gift',
          label: 'Take the gift',
          intent: 'The parcel is warm through the wrapping, or cold. It varies.',
          effects: [
            {
              kind: 'spawn_artifact',
              category: 'talisman',
              targetAgentId: '$actor',
              messageOverride: 'The crossroads gift, collected under the full moon.',
            },
          ],
        },
      ],
    },
  },
  narrativeTemplates: {
    initiation: 'A promise made at a crossroads falls due tonight.',
    success: 'The promise was kept, and the gift is real.',
    failure: 'The appointment was kept, and it cost more sleep than it should have.',
  },
  description:
    'Seeded Sequel of A Bargain at the Crossroads: the promise falls due, and the gift is ' +
    'collected. Vertical-slice encounter, THR-883.',
};

// ═════════════════════════════════════════════════════════════════════
// 5. THE SWINDLED FAMILY — Opt-in Complication (Hook #204)
//    ├─ seeds THE SWINDLER FOUND on the help path
//    └─ seeds THE GRATEFUL KIN on the help path
// ═════════════════════════════════════════════════════════════════════
//
// Crux: a swindled family is walking into the salt fen the traveler just
//       crossed, and only the traveler knows it.
// Shape: Opt-in Complication — the engage/decline gate runs on
// mercy↔ruthlessness (positive = mercy = help) · Setting: wayside · Pressure:
// hunger · Form: migration · Objectives: the family means to settle; the
// agent decides · Stakes: engaging costs real time (the walk to the unmarked
// turn); the reward is the seeded pair; declining costs one afterimage line ·
// System: movement + forks + seeds; the family's exhaustion is scene flavor
// with a live condition target.
// Why the agent: the family is walking into the agent's own back-trail this
// leg — scene-local knowledge, no prior-visit claim.
// Connected systems (Q8): forks, seeds ×2, conditions (a Balm target on the
// help step), cards — 4 beyond the core test.

const FAMILY_MEETING_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — life; the pity felt at full weight. Leans toward helping.
    id: 'slice.family.soft_heart',
    name: 'Soft Heart',
    sphere: 'life',
    essenceCost: 1,
    forecastDelta: 0.07,
    poleLean: { axis: 'mercy_ruthlessness', toward: 'positive' },
    imageTag: 'generic.balm',
    effectLine: 'You let the children’s worn shoes land at full weight, so the choice is made feeling everything there is to feel. A small help, and it argues for stopping.',
    fiction: 'Pity is information.',
    bandProse: {
      success: 'The smallest shoe did most of the talking.',
      failure: 'The pity landed whole. So did the count of miles left in the day.',
    },
  },
  {
    // Type: Boost — common; the road's arithmetic. Leans toward walking on.
    id: 'slice.family.hard_miles',
    name: 'Hard Miles',
    essenceCost: 1,
    forecastDelta: 0.05,
    poleLean: { axis: 'mercy_ruthlessness', toward: 'negative' },
    imageTag: 'generic.road',
    effectLine: 'You keep the traveler’s own road in view — the miles, the hour, the bed at the end — so the cost of stopping stays honest. A small help, and it argues for walking on.',
    fiction: 'Every kindness is paid for in miles.',
    bandProse: {
      near_miss: 'Their own road stayed honest in view, and it almost won.',
      failure: 'The miles argued so well that the argument was all they heard.',
    },
  },
  {
    // Type: Boost — order; the words that say a hard thing cleanly.
    id: 'slice.family.plain_words',
    name: 'Plain Words',
    sphere: 'order',
    essenceCost: 2,
    forecastDelta: 0.06,
    imageTag: 'generic.scroll',
    effectLine: 'You line the words up before they are needed, so the truth about the paper can be said without cruelty and without softening. A real help.',
    fiction: 'Bad news wants short sentences.',
    bandProse: {
      success_at_cost: 'The truth came out clean, and the man aged a year taking it.',
      success: 'The words came plain and kind at once, which is the hardest register there is.',
      failure: 'The words were lined up right, and the man refused delivery.',
    },
  },
  {
    // Type: Boost — mind; the story checked against itself.
    id: 'slice.family.their_story_holds',
    name: 'Their Story Holds',
    sphere: 'mind',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.insight',
    effectLine: 'You test the family’s tale as it is told, so the traveler knows the swindle is real before spending anything on it. A small help.',
    fiction: 'Check the story before you carry it.',
    bandProse: {
      near_miss: 'The story held everywhere except the one place it mattered.',
      failure: 'The tale checked out in every detail, which made it worse to hear.',
    },
  },
  {
    // Type: Boost — time; the fork seen from above.
    id: 'slice.family.long_memory',
    name: 'Long Memory',
    sphere: 'time',
    essenceCost: 2,
    forecastDelta: 0.07,
    imageTag: 'generic.time',
    effectLine: 'You stretch the view down both roads — theirs into the fen, the other toward the river country — so the choice is made seeing where each one ends. A real help.',
    fiction: 'Roads are honest about their endings.',
    bandProse: {
      critical_success: 'Both roads unrolled to their ends in one look, and one of them ended in reeds and salt.',
      critical_failure: 'The long view blurred at the worst reach of it, and the fen kept its distance quiet.',
    },
  },
];

const FAMILY_GUIDE_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — common; the ground read as it comes.
    id: 'slice.family.read_the_land',
    name: 'Read the Land',
    essenceCost: 1,
    forecastDelta: 0.08,
    imageTag: 'generic.focus',
    effectLine: 'You keep their eye on the ground’s grammar — the drainage, the grass, the tree line — so the good turn shows itself. A real help.',
    fiction: 'Land tells you what it is. Quietly.',
    bandProse: {
      success: 'The land read true a mile at a time, all the long afternoon.',
      failure: 'The land read true, and the light ran out with the reading half done.',
    },
  },
  {
    // Type: Boost — light; the landmark shown plain.
    id: 'slice.family.kind_light',
    name: 'Kind Light',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.07,
    imageTag: 'generic.light',
    effectLine: 'You hold the light long and low, so the unmarked turn reads from a distance and no one has to find it by luck. A real help.',
    fiction: 'A turn you can see is a turn you can teach.',
    bandProse: {
      critical_success: 'The low light picked the turn out of the country like a thumb on a map.',
      near_miss: 'The light held to the turn and not a stride past it.',
    },
  },
  {
    // Type: Boost — matter; the marker that stays behind.
    id: 'slice.family.sure_marker',
    name: 'Sure Marker',
    sphere: 'matter',
    essenceCost: 2,
    forecastDelta: 0.07,
    imageTag: 'generic.stonework',
    effectLine: 'You steady their hands building a cairn at the turn, so the road stays found after everyone walks away from it. A real help.',
    fiction: 'Pile three stones and the road remembers.',
    bandProse: {
      success_at_cost: 'The cairn went up sound. The light went while it did.',
      failure: 'The cairn was built with love and set a stride too early.',
    },
  },
  {
    // Type: Boost — energy; the family's last strength found.
    id: 'slice.family.second_wind_shared',
    name: 'Second Wind',
    sphere: 'energy',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.strength',
    effectLine: 'When the smallest walkers are done, their legs find one more hour. A small help that helps the whole line.',
    fiction: 'The body keeps a reserve the mind never meets.',
    bandProse: {
      near_miss: 'The children made the last mile. The cart barely did.',
      critical_failure: 'The second wind came, and the ninth day took it back with interest.',
    },
  },
  {
    // Type: Boost — time; the day paced to fit the detour.
    id: 'slice.family.gentle_hour',
    name: 'Gentle Hour',
    sphere: 'time',
    essenceCost: 1,
    forecastDelta: 0.05,
    imageTag: 'generic.time',
    effectLine: 'You stretch the useful part of the afternoon, so the detour fits inside the day it was given. A small help.',
    fiction: 'Some hours are wider than others.',
    bandProse: {
      failure: 'The hour stretched as far as an hour goes. The turn was further.',
    },
  },
];

const FAMILY_MEETING_STEP: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 1 },
  difficulty: 0.3,
  purposeLine: 'Hear them out',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The man says nine days. The children’s shoes agree. Turning them around means ' +
    'telling a tired man that his family’s one hope is a swindle. Setting them right ' +
    'means more: the river country two days south can feed a holding, and the turn to it is ' +
    'unmarked and easy to miss even when told. The children wave as the cart creaks past. ' +
    'The next town is an easy walk by dark.',
  successAfterimage: 'The family’s story was heard all the way through, paper and all.',
  failureAfterimage: 'The story came out sideways and slow, and the light spent itself on the telling.',
  successAtCostAfterimage: 'They heard it all, and some of it will be hard to put down again.',
  criticalSuccessAfterimage: 'The whole tale came out in order, and with it the name of the man who sold the paper.',
  criticalFailureAfterimage: 'The telling went wrong, and the man walked off mid-sentence to stand by his cart.',
  nudges: FAMILY_MEETING_HAND,
};

/** Help path — the walk to the unmarked turn. The delay is the price. */
const FAMILY_GUIDE_STEP: ActionStep = {
  reach: 'eye',
  duration: { min: 2, max: 3 },
  difficulty: 0.4,
  purposeLine: 'Find them a living road',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The river country is two days south for a cart this tired, and the turn to it hides in ' +
    'ordinary grass. The traveler walks at the head of the little column, reading the land, ' +
    'while the paper that started all this rides folded and demoted in the woman’s apron.',
  successAfterimage: 'The turn was found and marked, and the family went south toward water that exists.',
  failureAfterimage: 'The turn hid past dusk, and the family camped one more night on hope and thin bread.',
  successAtCostAfterimage: 'The turn was found late, and the traveler’s own road is now a day longer.',
  criticalSuccessAfterimage: 'The turn, a cairn, and a first green look at the river country, all before dark.',
  criticalFailureAfterimage: 'The country fought the reading all day, and the family’s faith in strangers thinned with the light.',
  nudges: FAMILY_GUIDE_HAND,
};

/** Decline path — the road taken, the afterimage kept. */
const FAMILY_PASS_STEP: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 1 },
  difficulty: 0.15,
  purposeLine: 'Walk on',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The traveler wishes them luck, and means it, and keeps walking. The cart creaks east. ' +
    'For a while the road behind stays loud with children’s voices, and then the country ' +
    'folds them away.',
  successAfterimage: 'The traveler made the town by dark, as planned.',
  failureAfterimage: 'The town came by dark, and the supper tasted like the word swindle.',
  successAtCostAfterimage: 'The road stayed easy. The evening did not.',
  criticalSuccessAfterimage: 'The town, a bed, an early start — the road rewards the undelayed.',
  criticalFailureAfterimage: 'All evening the fen kept coming to mind, salt-grey and patient.',
};

const FAMILY_FORK: ActionStepBranch = {
  branchOnStep: 0,
  decidedBy: { axis: 'mercy_ruthlessness' },
  variants: {
    positive: FAMILY_GUIDE_STEP,
    negative: FAMILY_PASS_STEP,
  },
  fallback: FAMILY_PASS_STEP,
};

export const SLICE_SWINDLED_FAMILY: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.family,
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'The Swindled Family',
  reach: 'heart',
  crudType: 'read',
  scale: 'local',
  steps: [FAMILY_MEETING_STEP, FAMILY_FORK],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['mercy_ruthlessness'],
  settings: ['wayside'],
  openings: {
    wayside:
      'The family comes the other way an hour after noon: a handcart, a man and a woman ' +
      'walking beside it, three children, and a dog too tired to bark at strangers. They are ' +
      'cheerful. A man in a market sold them a paper to good land in the east, and they hold ' +
      'it out to be admired. Their road east is the road the traveler has just come down. ' +
      'There is no farmland back there — there is a salt fen and a burned survey post.',
  },
  locationSubtypes: expandSettings(['wayside']),
  traitVariants: [
    {
      // Warmth does not need persuading to stop.
      traitId: 'trait.core.core_warmth.virtue',
      forecastDelta: 0.05,
      factorLine: 'Warm-hearted, they were slowing before the cart reached them.',
    },
  ],
  aftermathConfig: {
    // The deciding step, not the fork's own index — see THR-979 on the
    // crossroads config. FAMILY_FORK declares `branchOnStep: 0`.
    branchOnStep: 0,
    variants: {
      positive: {
        overview:
          'The family turns south with a marked road and a truer map of the world. What ' +
          'was done on this stretch of road will travel: swindles have authors, and ' +
          'kindnesses have kin.',
        changes: [],
        reactions: [
          {
            id: 'slice.family.watch_them_go',
            label: 'Watch them go',
            intent: 'The cart shrinks southward, and the road resumes.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: SLICE_TEMPLATE_IDS.swindlerFound,
                targetAgentId: '$actor',
                delayTicks: SLICE_SWINDLER_DELAY_TICKS,
                seedLabel: 'The man who sold the paper is still working, and his face is known now.',
                inheritContext: true,
              },
              {
                kind: 'encounter_seed',
                templateId: SLICE_TEMPLATE_IDS.gratefulKin,
                targetAgentId: '$actor',
                delayTicks: SLICE_KIN_DELAY_TICKS,
                seedLabel: 'Word of a kindness on the fen road is traveling ahead of the traveler.',
                inheritContext: true,
              },
            ],
          },
        ],
      },
      negative: {
        overview:
          'The road east keeps the family, and the fen keeps the road. What happens ' +
          'out there now happens without witnesses.',
        changes: [],
        reactions: [
          {
            id: 'slice.family.make_the_town',
            label: 'Make the town by dark',
            intent: 'The planned road, at the planned pace.',
            effects: [],
          },
        ],
      },
    },
    fallback: {
      overview: 'The two roads part at the meeting point, each taking its own people.',
      changes: [],
      reactions: [
        {
          id: 'slice.family.roads_part',
          label: 'Let the roads part',
          intent: 'East is theirs. The rest is the traveler’s.',
          effects: [],
        },
      ],
    },
  },
  narrativeTemplates: {
    initiation: 'A cheerful family is walking into a salt fen with a worthless paper for a map.',
    success: 'The family’s road was mended, or honestly left — both on purpose.',
    failure: 'The meeting went poorly, and both roads kept their troubles.',
  },
  description:
    'Opt-in Complication (Hook #204): the mortal decides, from who they are, whether to ' +
    'spend a day saving strangers from a swindle. The help path seeds The Swindler Found ' +
    'and The Grateful Kin. Vertical-slice encounter, THR-883.',
};

// ═════════════════════════════════════════════════════════════════════
// 5b. THE SWINDLER FOUND — Seeded Sequel of the family (help path)
// ═════════════════════════════════════════════════════════════════════
//
// Crux: the man who sold the family their worthless paper is working a new
//       crowd, and the traveler knows his face.
// Shape: Seeded Sequel → Personality Fork on mercy↔ruthlessness — positive
// (Protector) hands him to the town's justice; negative (Conqueror) settles
// it directly · Setting: urban · Pressure: greed (his) · Form: accusation ·
// Objective: prevent · Stakes: no-penalty + closing the chain · System:
// forks + seeds (closing); conditions on a bad end.
// Prose rule 7: "the same coat, the same paper" is legal here — the parent
// minted this knowledge, and this template only fires from its seed.

const SWINDLER_MARK_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared focus family, the common option.
    id: 'slice.swindler.steady_gaze',
    name: 'Steady Gaze',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.focus',
    effectLine: 'You hold their look calm and unhurried, so the man is confirmed without feeling watched. A small help.',
    fiction: 'Stare with your ears.',
    bandProse: {
      success: 'It was him: same coat, same cadence, same paper held up like a lamp.',
      near_miss: 'It was him past all doubt. Doubt was not the one watching back.',
    },
  },
  {
    // Type: Boost — spirit; the crowd's mood read as one animal.
    id: 'slice.swindler.crowds_mood',
    name: 'Crowd’s Mood',
    sphere: 'spirit',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.bond',
    effectLine: 'You read the market’s temper — who believes him, who wavers, who would turn — so the moment to act is chosen, never stumbled into. A real help.',
    fiction: 'A crowd is one animal with many opinions.',
    bandProse: {
      success_at_cost: 'The crowd’s temper read true, and reading it meant standing close enough to be remembered.',
      failure: 'The market’s mood ran shallow and pleased, the worst weather for a hard truth.',
    },
  },
  {
    // Type: Boost — order, this card leans toward the law's road.
    id: 'slice.swindler.cold_certainty',
    name: 'Cold Certainty',
    sphere: 'order',
    essenceCost: 2,
    forecastDelta: 0.07,
    poleLean: { axis: 'mercy_ruthlessness', toward: 'positive' },
    imageTag: 'generic.scroll',
    effectLine: 'You order what is known into a case a warden can act on, so the town’s own justice can carry the weight. A real help, and it argues for the law.',
    fiction: 'Anger fades. Records convict.',
    bandProse: {
      critical_success: 'The case assembled itself: the paper, the patter, the family’s names, the fen.',
      failure: 'The case was sound and the wardens were elsewhere, the town-sized version of bad weather.',
    },
  },
  {
    // Type: Undertow — life inverted? No: chaos, and it leans toward settling it directly.
    id: 'slice.swindler.old_anger',
    name: 'Old Anger',
    sphere: 'chaos',
    essenceCost: 1,
    forecastDelta: 0.06,
    poleLean: { axis: 'mercy_ruthlessness', toward: 'negative' },
    imageTag: 'generic.ember',
    effectLine: 'You let the memory of the children’s shoes burn at full heat, so the choice is made knowing exactly how angry the traveler is. A small help, and it argues for settling it here.',
    fiction: 'Some debts want a personal collector.',
    bandProse: {
      near_miss: 'The anger burned clean and nearly chose the hour by itself.',
      critical_failure: 'The anger arrived ahead of the plan and introduced itself to the whole market.',
    },
  },
  {
    // Type: Boost — time; the pitch heard through to its pattern.
    id: 'slice.swindler.patient_hour',
    name: 'Patient Hour',
    sphere: 'time',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.time',
    effectLine: 'You hold the watching patient through one whole pitch, so the man’s pattern is learned before it is interrupted. A small help.',
    fiction: 'Habits outlast intentions.',
    bandProse: {
      near_miss: 'The pattern came clear just as the pitch ended and the crowd began to pay.',
    },
  },
];

const SWINDLER_MARK_STEP: ActionStep = {
  reach: 'eye',
  duration: { min: 1, max: 1 },
  difficulty: 0.35,
  purposeLine: 'Mark the man',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'A new family is listening at the corn scales, and the youngest of them is already ' +
    'smiling at the pictures the voice is painting. The paper changes hands for admiring. ' +
    'The town has wardens, a lockup, and a market bell; the man has a satchel, an exit ' +
    'through the crowd, and no idea who is watching him work.',
  successAfterimage: 'The man was marked, his patter noted, his exits counted.',
  failureAfterimage: 'The man worked the crowd like a professional, and professionals watch for watchers.',
  successAtCostAfterimage: 'He was marked, and once, briefly, he looked straight back.',
  criticalSuccessAfterimage: 'Marked, mapped, and his next pitch predicted to the sentence.',
  criticalFailureAfterimage: 'He was gone from the scales between one look and the next, the market suddenly short one voice.',
  nudges: SWINDLER_MARK_HAND,
};

/** Law path — the town's justice takes him. */
const SWINDLER_LAW_STEP: ActionStep = {
  reach: 'gold',
  duration: { min: 1, max: 2 },
  difficulty: 0.4,
  purposeLine: 'Bring the wardens',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'Wardens move at the speed of paperwork, and the man sells at the speed of hope. The ' +
    'work is to bring the two speeds together in one market square: the case said plainly, ' +
    'the paper in a warden’s hand, the man still behind his patter when the bell ends it.',
  successAfterimage: 'The wardens took him at the scales with the paper still in his hand.',
  failureAfterimage: 'The wardens came at their own pace, and the man left at his.',
  successAtCostAfterimage: 'He was taken, and the crowd’s disappointment needed managing more than he did.',
  criticalSuccessAfterimage: 'Taken mid-sentence, and the listening family got their coin back on the spot.',
  criticalFailureAfterimage: 'The wardens arrived to an empty pitch and one annoyed witness.',
};

/** Direct path — the settling, done personally. */
const SWINDLER_DIRECT_STEP: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 1 },
  difficulty: 0.4,
  purposeLine: 'Corner him',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'There is an alley behind the corn scales where the market noise goes quiet, and the ' +
    'man’s exit route runs through it. The work is simple and personal: be there when ' +
    'he takes it, and make the fen road cost him what it was going to cost that family.',
  successAfterimage: 'The alley conversation was short, and the satchel of takings changed ownership.',
  failureAfterimage: 'The man knew his own exits better than his marks did, and used one.',
  successAtCostAfterimage: 'He paid in the alley, and the traveler carried the bruises of the argument out of it.',
  criticalSuccessAfterimage: 'He paid everything, signed his own confession in front of two porters, and left town at a run.',
  criticalFailureAfterimage: 'The alley went wrong: he had a knife, a friend, and no interest in fair fights.',
};

const SWINDLER_FORK: ActionStepBranch = {
  branchOnStep: 0,
  decidedBy: { axis: 'mercy_ruthlessness' },
  variants: {
    positive: SWINDLER_LAW_STEP,
    negative: SWINDLER_DIRECT_STEP,
  },
  fallback: SWINDLER_LAW_STEP,
};

export const SLICE_SWINDLER_FOUND: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.swindlerFound,
  rarityTier: 3,
  intrinsicTier: 'background',
  name: 'The Swindler Found',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',
  steps: [SWINDLER_MARK_STEP, SWINDLER_FORK],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['mercy_ruthlessness'],
  settings: ['urban'],
  openings: {
    urban:
      'The market smell of the place is bread and wet wool, and over by the corn scales a ' +
      'familiar voice is talking about land in the east. Same coat. Same paper, held up ' +
      'like a lamp. The traveler has heard this exact speech before, on a road beside a ' +
      'handcart, from the mouths of the people it ruined.',
  },
  locationSubtypes: expandSettings(['urban']),
  aftermathConfig: {
    // The deciding step, not the fork's own index — see THR-979 on the
    // crossroads config. SWINDLER_FORK declares `branchOnStep: 0`.
    branchOnStep: 0,
    variants: {
      positive: {
        overview:
          'The town’s justice has the man, the paper, and the pattern. What the fen ' +
          'road started, a lockup finishes — slower than anger, and it holds.',
        changes: [],
        reactions: [
          {
            id: 'slice.swindler.leave_it_to_law',
            label: 'Leave him to the town',
            intent: 'The bell, the wardens, the ledger. Done.',
            effects: [],
          },
        ],
      },
      negative: {
        overview:
          'The debt was collected in person. The market will tell the story in its own words, ' +
          'and the story will grow a knife it may or may not have had.',
        changes: [],
        reactions: [
          {
            id: 'slice.swindler.walk_away',
            label: 'Walk away',
            intent: 'The alley empties. The road waits.',
            effects: [],
          },
        ],
      },
    },
    fallback: {
      overview: 'The market closes around the space where the voice was.',
      changes: [],
      reactions: [
        {
          id: 'slice.swindler.market_closes',
          label: 'Let the market close',
          intent: 'Stalls fold. The square empties.',
          effects: [],
        },
      ],
    },
  },
  narrativeTemplates: {
    initiation: 'A familiar voice is selling a familiar lie two markets from the fen road.',
    success: 'The paper trade ended in this town, by warden or by alley.',
    failure: 'The man and his satchel moved on to a town with no one watching.',
  },
  description:
    'Seeded Sequel of The Swindled Family: the paper-seller resurfaces, and the mortal ' +
    'decides what justice looks like. Vertical-slice encounter, THR-883.',
};

// ═════════════════════════════════════════════════════════════════════
// 5c. THE GRATEFUL KIN — Seeded Sequel of the family (help path)
// ═════════════════════════════════════════════════════════════════════
//
// Crux: word of a kindness on the road has run ahead of the traveler, and a
//       stranger wants to repay it.
// Shape: Seeded Sequel (gentle Single Test) · Setting: rural + urban ·
// Pressure: love · Form: return · Objective: repay (hers) · Stakes:
// relationship — THE legitimate favor mint: the favor edge is written HERE,
// in aftermath, and only from here on may prose ever lean on it — plus a
// pressed keepsake (item) · System: seeds (closing), favors (middling tier,
// used once in the slice, deliberately), items.

const KIN_STEP: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 1 },
  difficulty: 0.2,
  purposeLine: 'Take the thanks',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The bowl arrives unasked and the coin is refused twice. The room has gone interested. ' +
    'There is a letter in her apron with the whole fen road in it, and the ' +
    'traveler described down to the boots. Public gratitude is its own weather. It has to ' +
    'be stood in graciously.',
  successAfterimage: 'The thanks was taken well, and the room warmed accordingly.',
  failureAfterimage: 'The thanks was shrugged at, and the shrug landed harder than meant.',
  successAtCostAfterimage: 'The thanks was taken, along with three retellings and a toast.',
  criticalSuccessAfterimage: 'By the second bowl the whole room owned a piece of the story, and the traveler owned the room.',
  criticalFailureAfterimage: 'The public gratitude curdled into public performance, and the traveler wore it all evening.',
};

export const SLICE_GRATEFUL_KIN: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.gratefulKin,
  rarityTier: 3,
  intrinsicTier: 'background',
  name: 'The Grateful Kin',
  reach: 'heart',
  crudType: 'read',
  scale: 'local',
  steps: [KIN_STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['loyalty_ambition'],
  settings: ['rural', 'urban'],
  openings: {
    rural:
      'The innkeeper sets down the bowl unasked, and will not take the coin for it. ' +
      '“You walked my brother’s family off the fen road,” she says. “Nine ' +
      'days out with three children, and a stranger turned them around.”',
    urban:
      'The taproom is city-loud until the landlady crosses it with a bowl nobody ordered. ' +
      '“My cousin’s people,” she says, setting it down. “The fen road. ' +
      'You are the one who walked them south.” Half the nearest table has already ' +
      'turned around to look.',
  },
  locationSubtypes: expandSettings(['rural', 'urban']),
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The kindness has kin, and the kin keep accounts. From tonight the traveler has a ' +
        'roof in this family’s memory, which is a currency that holds its value.',
      changes: [],
      reactions: [
        {
          id: 'slice.kin.accept_the_debt',
          label: 'Accept the thanks',
          intent: 'A meal, a story told rightly, and a standing welcome.',
          effects: [
            {
              kind: 'favor_creation',
              magnitudeRange: [0.4, 0.7],
              context: 'The fen-road kindness: the family’s kin owe the traveler a roof and more.',
            },
          ],
        },
      ],
    },
  },
  narrativeTemplates: {
    initiation: 'Word of the fen-road kindness has run ahead of the traveler.',
    success: 'The thanks was taken well, and a family’s memory now has the traveler in it.',
    failure: 'The gratitude was fumbled, and the room let it drop politely.',
  },
  description:
    'Seeded Sequel of The Swindled Family: the kindness is repaid, and the favor edge is ' +
    'minted — the legitimate birth of history. Vertical-slice encounter, THR-883.',
};

// ─── The slice, assembled ────────────────────────────────────────────

/**
 * THR-932: `compileOpeningEnvelope` turns each template's authored `openings` table
 * into the reserved `opening` fragment set and prepends its token to step 0. Without
 * it, `openings` on a direct-authored template is a field with no reader and every
 * approved scene-setting paragraph here ships but never renders. Applied once, at
 * module load — the two catalog spreads in `unified-action-templates.ts` both consume
 * this already-compiled array.
 */
export const VERTICAL_SLICE_TEMPLATES: readonly UnifiedActionTemplate[] = [
  SLICE_UNSAFE_BRIDGE,
  SLICE_SNOW_ON_THE_PASS,
  SLICE_RIDERS_BEHIND_CARAVAN,
  SLICE_BARGAIN_AT_CROSSROADS,
  SLICE_FULL_MOON_COLLECTION,
  SLICE_SWINDLED_FAMILY,
  SLICE_SWINDLER_FOUND,
  SLICE_GRATEFUL_KIN,
].map(compileOpeningEnvelope);
