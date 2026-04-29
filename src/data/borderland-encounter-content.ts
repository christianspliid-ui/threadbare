/**
 * Borderland Encounter Content — Phase 4 migration to UnifiedActionTemplate (THR-107).
 *
 * Twenty templates covering bandits, outlaws, wild beasts, scavengers, and
 * minor supernatural threats found in borderland terrain: wilderness, camps,
 * ruins, farmland, and frontier settlements.
 *
 * Designed for beginner agents (capability ~0.05–0.25). Each template carries
 * Threadbare-aesthetic prose — sensory-first, plain-observational, low-fantasy —
 * and authored aftermath with borderland-specific consequences:
 *
 *   • Encounter seeds for persistent threats (the wolf pack returns, the
 *     deserter becomes an informant, the smugglers revisit their stash)
 *   • Hidden marks for witnessed mercy, cruelty, or exposure
 *   • Intelligence grants when knowledge is the real prize
 *   • Reputation tallies accumulating the early-career combat record
 *
 * Voice: mud, weather, hunger, fear. Sensory and concrete. No bardic elevation.
 * Earn the player's attention with specificity, not grandeur.
 *
 * Registration: spread into UNIFIED_ACTION_TEMPLATES via unified-action-templates.ts.
 * Lookup function getBorderlandEncounterById preserved for backward compat
 * with encounter-content.ts getAnyEncounterById fallback chain.
 *
 * NFP #1: All difficulty values are named constants (Tunability).
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';

// ─── Tunable Constants ──────────────────────────────────────────────────────

/** Normalized difficulty base for trivial borderland encounters (÷100 from legacy scale). */
const TRIVIAL_DIFFICULTY_BASE = 0.05;

/** Normalized difficulty step for trivial encounters. */
const TRIVIAL_DIFFICULTY_STEP = 0.05;

/** Normalized difficulty base for easy borderland encounters. */
const EASY_DIFFICULTY_BASE = 0.12;

/** Normalized difficulty step for easy encounters. */
const EASY_DIFFICULTY_STEP = 0.06;

// ─── Borderland Encounter Templates ─────────────────────────────────────────

export const BORDERLAND_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  //  BANDITS & OUTLAWS (7 templates)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 1. Roadside Shakedown (trivial, duel) ──────────────────────────────────
  {
    id: 'borderland.roadside_shakedown',
    name: 'Roadside Shakedown',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'heart',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'camp', 'farmland'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A figure steps onto the path at {location}, blade drawn with the particular confidence ' +
          'of someone who has done this before and not been hurt yet. "Your coin or your blood." ' +
          '{name} reads the stance — weight on the back foot, eyes tracking the pack rather than the face. ' +
          '{?has_ally}{name} catches {ally:strongest}\'s eye sidelong: two of them, one robber. ' +
          'The math is obvious, and the robber knows it.{/has_ally}' +
          '{?no_ally}Alone on the road. The robber has picked well, or thinks {they} have.{/no_ally}',
        successAfterimage:
          '{name} holds ground and meets the robber\'s eyes without hurrying. ' +
          'Something in that stillness convinces the thug that this mark is not what the day requires. ' +
          'The blade lowers. The path opens.',
        failureAfterimage:
          'The robber holds their nerve longer than expected. {name} pays the toll — ' +
          'a few coins, not a wound — and files the encounter away as information about this stretch of road.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#combat'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The robber bolts into the undergrowth. {name} can let them go — or make sure this road ' +
          'becomes known as one where the toll collectors get worse than they give.',
        successAfterimage:
          '{name} catches the outlaw at the tree line, recovers what was taken, and leaves them with ' +
          'a clear memory of the encounter. The road will be quieter for it.',
        failureAfterimage:
          'The outlaw knows these paths the way {name} does not. The brush closes behind them, ' +
          'and {name} is left with a quieter road and an unresolved account.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} faces a roadside extortion attempt near {location}.',
      success: 'The would-be robber is dealt with. The road is clear.',
      failure: 'The robber got away. The stretch of road near {location} remains unsafe.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A lone extortionist at {location} — small in scale, but these encounters accumulate. ' +
          'How {name} handled it is the first entry in a record that will be read differently ' +
          'when the tally is longer.',
        changes: [
          {
            id: 'roadside_shakedown_tally',
            kind: 'reputation_tally',
            title: 'Borderland Road Encounters',
            detail: 'Each handled threat on the borderland roads adds to a quiet record of reliability.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god mark in this small confrontation?',
        reactions: [
          {
            id: 'roadside_shakedown_tally_mark',
            label: 'One more threat cleared from the road.',
            intent:
              'The borderland roads are catalogued by the people who travel them. ' +
              '{name}\'s handling of this stretch will eventually surface in local reputation — ' +
              'the slow accumulation of "reliable on the frontier."',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.road_threats_cleared', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'roadside_shakedown_seed_return',
            label: 'The robber will be back. Or word of this road will spread.',
            intent:
              'An extortionist driven off a lucrative route does not retire — they shift or recruit. ' +
              'The same stretch of road near {location} will see another attempt, better prepared.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'borderland',
                delayTicks: 24,
                priority: 0.4,
                seedLabel: 'The outlaw driven off near {location} has regrouped — or found allies.',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 2. Bandit Scouts (easy, duel) ──────────────────────────────────────────
  {
    id: 'borderland.bandit_scouts',
    name: 'Bandit Scouts',
    rarityTier: 2,
    intrinsicTier: 'background',
    reach: 'eye',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'camp', 'ruins'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Movement in the tree line — a glint of metal through leaves, a cough stifled a half-second too late. ' +
          '{name} slows at {location} without stopping, counting what the undergrowth is willing to show. ' +
          '{?has_ally}{name} and {ally:strongest} exchange the look that means: two of them, at least, ' +
          'watching from the north side. The question is whether there are more.{/has_ally}' +
          '{?no_ally}Two shapes visible. Probably two total. Scouts travel light, and the tree line ' +
          'has not given up anything else.{/no_ally}',
        successAfterimage:
          '{name} maps both scouts before either one notices the observation running both ways. ' +
          'The advantage of the moment belongs to the aware.',
        failureAfterimage:
          'One scout catches {name}\'s eyes moving through the shadows and whistles a two-note signal. ' +
          'The element of surprise has changed owners.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#combat'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
        narrativeTemplate:
          'Two against one, but scouts are watchers, not fighters — their value is information, ' +
          'not armor. {name} moves before they can fall back and report.',
        successAfterimage:
          'Both scouts scatter into the brush, empty-handed and shaken. ' +
          'They will tell the main camp that this road is not worth the attention, ' +
          'and the camp will probably believe them.',
        failureAfterimage:
          'The scouts disengage clean and professionally, taking their observations with them. ' +
          '{name}\'s face, gear, and heading are now part of a report that will reach someone worse.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} spots bandit scouts watching the road near {location}.',
      success: 'The scouts are driven off. The main camp loses its eyes on this stretch.',
      failure: 'The scouts escape with a clear look at {name}. The main camp is now informed.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Scouts are not accidents — they mean an organized camp, a patrol route, a decision ' +
          'that this road near {location} is worth watching. {name} has now been watched.',
        changes: [
          {
            id: 'bandit_scouts_exposure',
            kind: 'reputation_tally',
            title: 'Bandit Confrontations',
            detail: 'Each handled bandit threat adds to a record the frontier roads quietly keep.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note about what just happened?',
        reactions: [
          {
            id: 'bandit_scouts_tally',
            label: 'A threat handled on the borderland road.',
            intent:
              'Scout encounters are the precursor to something larger. The god draws a mark for {name} — ' +
              'not for the fight itself, but for the vigilance that found it first.',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.road_threats_cleared', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'bandit_scouts_hidden_mark_exposed',
            label: 'If the scouts escaped, {name} is now a name in someone\'s report.',
            intent:
              'An identified traveler on a bandit-watched road is a target for escalation. ' +
              'The main camp now has a description and a heading.',
            effects: [
              {
                kind: 'hidden_mark',
                key: 'bandit.scout_identified',
                label: 'Identified by bandit scouts near {location}',
                hidden: true,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'bandit_scouts_seed_camp',
            label: 'There is a main camp behind these scouts.',
            intent:
              'Scouts do not operate alone. The camp they report back to is nearby — ' +
              'and will respond to the news of what happened on this stretch of road.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'borderland',
                delayTicks: 18,
                priority: 0.55,
                seedLabel: 'The bandit camp near {location} has heard about the scout engagement — they are responding.',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 3. Toll Bridge Bully (trivial, duel) ───────────────────────────────────
  {
    id: 'borderland.toll_bridge_bully',
    name: 'Toll Bridge Bully',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'heart',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'farmland', 'hamlet'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence', 'honesty_cunning'],
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A heavyset figure stands mid-bridge at {location}, arms folded, with the particular stillness ' +
          'of someone who has been here all morning and will be here all afternoon. ' +
          'No badge. No charter. Just muscle and the reasonable assumption that most people ' +
          'would rather pay than argue. ' +
          '{?has_ally}{name} and {ally:strongest} exchange a glance — the bully has noticed them both, ' +
          'and is doing the arithmetic of two versus one.{/has_ally}' +
          '{?no_ally}{name} is alone, which the bully will have already clocked.{/no_ally}',
        successAfterimage:
          '{name} meets the bully\'s eyes and does not look away or reach for a coin. ' +
          'Something in that steadiness — the particular way of standing that says this argument ' +
          'will cost more than it\'s worth — makes the thug step aside.',
        failureAfterimage:
          '{name} pays. The bully takes the coin with the satisfaction of someone who has been right ' +
          'about people for a long time. The crossing is open, and the debt is only money.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#combat'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The bully takes the first swing — slow, committed, the kind of haymaker that relies ' +
          'on mass rather than technique. {name} has a clear half-second to decide how this ends.',
        successAfterimage:
          '{name} sidesteps and uses the bully\'s momentum. The crossing is open, ' +
          'and the bully will remember why the good spots on this road are already taken.',
        failureAfterimage:
          'The bully is stronger than expected — or drunker, which amounts to the same thing. ' +
          '{name} finds the ford downstream instead, wet-booted and wiser about this particular bridge.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} confronts an unauthorized toll collector blocking a crossing at {location}.',
      success: 'The bully is cleared from the bridge. The crossing is free.',
      failure: 'The bully holds the bridge. {name} finds another way across.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A toll bully on a well-used crossing at {location} is small leverage but consistent income — ' +
          'enough to matter to the travelers who rely on this road, not enough to attract official attention.',
        changes: [
          {
            id: 'toll_bridge_public',
            kind: 'reputation_tally',
            title: 'Public Road Interventions',
            detail: 'Handling small abuses on public roads — the kind of action noticed by travelers, not officials.',
            polarity: 'positive',
          },
        ],
        reactionPrompt: 'What does the god mark here?',
        reactions: [
          {
            id: 'toll_bridge_road_tally',
            label: 'A crossing cleared for everyone who comes after.',
            intent:
              'This road is used by farmers, merchants, and travelers who have no recourse ' +
              'against someone with bulk and impunity. {name} is the recourse today.',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.public_good', delta: 1 },
              {
                kind: 'recent_event',
                message: '{name} clears a toll extortionist from a crossing at {location}.',
                significance: 0.3,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'toll_bridge_intel',
            label: 'Where did this person come from? Someone sends them.',
            intent:
              'A toll bully does not operate alone out of initiative — someone owns the arrangement, ' +
              'or at least benefits from it. There is more to this crossing than this morning.',
            effects: [
              {
                kind: 'intelligence',
                category: 'faction_position',
                label: 'Toll extortion network at {location}',
                detail:
                  'The bully at the bridge is not independent — someone local benefits from the arrangement. ' +
                  'The name of the arrangement\'s owner is a question worth asking.',
                reliability: 0.5,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 4. Outlaw Camp Raid (easy, steal → read) ───────────────────────────────
  {
    id: 'borderland.outlaw_camp',
    name: 'Outlaw Camp',
    rarityTier: 2,
    intrinsicTier: 'background',
    reach: 'shadow',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['wilderness', 'camp', 'ruins'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['honesty_cunning', 'courage_prudence'],
    steps: [
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Smoke rises from a hidden dell near {location} — cook fire, not signal, ' +
          'which means they think they are invisible. {name} crouches at the tree line and counts: ' +
          'three bedrolls visible, two figures awake, one sentry moving the wrong way for a sentry. ' +
          '{?has_ally}{ally:strongest} takes the left flank without being told — old habit or good instinct, ' +
          'and {name} does not need to ask which.{/has_ally}' +
          '{?no_ally}Alone in the tree line. One approach, one chance to read the camp before it changes.{/no_ally}',
        successAfterimage:
          '{name} maps every sentry post, every escape route, the pile of stolen goods by the largest tent. ' +
          'The outlaws are comfortable — comfortable enough to be careless.',
        failureAfterimage:
          'A branch snaps under {their} boot at exactly the wrong moment. ' +
          'The nearest sentry\'s head comes up. {name} commits to the improvised version of the plan.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.05,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#combat'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
        narrativeTemplate:
          'Three outlaws around a fire, short blades within reach, the goods stacked between them ' +
          'and the tree line. {name} has the seconds before they arm themselves.',
        successAfterimage:
          '{name} moves through the camp before the outlaws can form up — quick, direct, ' +
          'enough noise to make them think there are more attackers than there are. ' +
          'They flee into the woods clutching what they can carry, and what they can carry is not much.',
        failureAfterimage:
          'The outlaws fight back harder than their appearance suggested. ' +
          '{name} withdraws before the situation becomes a surrounded one, ' +
          'leaving the camp intact and the goods unrecovered.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} locates a bandit camp near {location} and moves against it.',
      success: 'The camp is scattered. The outlaws flee into the wilderness.',
      failure: 'The camp holds. {name} withdraws without the goods.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A cleared camp near {location} does not end the problem — it relocates it. ' +
          'Outlaws who scatter regroup, and a camp that was here will be somewhere nearby within the week.',
        changes: [
          {
            id: 'outlaw_camp_cleared',
            kind: 'reputation_tally',
            title: 'Camp Clearances',
            detail: 'Organized outlaw camps cleared — a measure of frontier capability.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note about the camp?',
        reactions: [
          {
            id: 'outlaw_camp_tally',
            label: 'A camp cleared, for now.',
            intent:
              'Clearing a camp is temporary — but the reputation of someone who does it is not. ' +
              '{name}\'s name will eventually attach to this piece of road.',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.camps_cleared', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'outlaw_camp_intel',
            label: 'What were they protecting? The goods tell a story.',
            intent:
              'Outlaw camps do not collect random goods — they are logistical nodes in a larger operation. ' +
              'The composition of the stolen pile reveals who they were working with, or against.',
            effects: [
              {
                kind: 'intelligence',
                category: 'faction_position',
                label: 'Outlaw camp near {location} — goods and affiliations',
                detail:
                  'The recovered goods suggest a supply line or a specific target. ' +
                  'Someone local is either the source of the stolen items, the intended buyer, or both.',
                reliability: 0.6,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 5. Desperate Deserter (trivial, duel) ──────────────────────────────────
  {
    id: 'borderland.desperate_deserter',
    name: 'Desperate Deserter',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'heart',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'farmland', 'camp', 'ruins'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['mercy_ruthlessness', 'courage_prudence'],
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A ragged figure erupts from the ditch beside the road near {location} — torn soldier\'s colors, ' +
          'three days of beard, a knife held the way people hold knives when they have not eaten. ' +
          'The lunge is committed but slow. Hunger has stolen the quickness from it. ' +
          '{name} steps back and gets a full look: this is not an ambush, it is a collapse.',
        successAfterimage:
          '{name} catches the knife wrist and holds it until the fight drains out of the deserter entirely. ' +
          'It does not take long. The man is on his knees before {name} has to decide what to do next.',
        failureAfterimage:
          'The deserter\'s desperation gives them an edge that training alone would not — ' +
          '{name} takes a shallow cut across the forearm before getting enough distance to reassess. ' +
          'The man is still standing, barely.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#combat'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The deserter kneels in the road, weapon dropped, looking at the dirt. ' +
          'Starving, terrified, a long way from whatever unit he left behind. ' +
          '{name} must decide what mercy looks like out here — and whether the road can afford ' +
          'to leave him to the next traveler.',
        successAfterimage:
          '{name} handles the situation as the road requires — the deserter is dealt with, ' +
          'bound or redirected or given enough to reach the next settlement, ' +
          'and the road is safer for it in one way or another.',
        failureAfterimage:
          'The deserter bolts when {name} hesitates — reads the hesitation correctly ' +
          'as a window and takes it. He disappears into the field grass, ' +
          'and {name} is left with the problem passed forward to the next traveler.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} is attacked by a desperate deserter near {location}.',
      success: '{name} handles the deserter. The road is clear.',
      failure: 'The deserter escapes. The problem moves down the road.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A deserter is not just a man who ran — they carry information about a unit, a campaign, ' +
          'a command structure. What {name} did with that information is a choice ' +
          'the borderland will remember differently than a city would.',
        changes: [
          {
            id: 'deserter_mercy_mark',
            kind: 'hidden_mark',
            title: 'Witness to the Deserter\'s Fate',
            detail: 'The deserter saw how {name} handled the desperate and the broken. That observation travels.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god record about the choice made here?',
        reactions: [
          {
            id: 'deserter_mercy_mark_apply',
            label: 'The deserter remembers who spared him — or who did not.',
            intent:
              'Mercy shown on a frontier road is the rarest kind, and it is not forgotten. ' +
              'A man who was spared when he expected otherwise carries that fact back ' +
              'into whatever life comes next.',
            effects: [
              {
                kind: 'hidden_mark',
                key: 'borderland.mercy_witness',
                label: 'Witnessed mercy — or its absence — in a desperate moment near {location}',
                hidden: false,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'deserter_seed_informant',
            label: 'A man who owes you his life is a useful contact.',
            intent:
              'Deserters know where they came from — unit movements, supply depots, ' +
              'the names of officers who took bribes. A spared deserter becomes an irregular informant ' +
              'who will surface again when {name} least expects it, with information worth the mercy.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'investigation',
                delayTicks: 36,
                priority: 0.6,
                seedLabel: 'The deserter spared near {location} has circled back with information — or a request.',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 6. Caravan Thieves (easy, duel) ────────────────────────────────────────
  {
    id: 'borderland.caravan_thieves',
    name: 'Caravan Thieves',
    rarityTier: 2,
    intrinsicTier: 'background',
    reach: 'eye',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'farmland', 'hamlet'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Shouts from the road ahead — a merchant\'s wagon tilted in a ditch at {location}, ' +
          'the driver pinned under the traces, two figures rifling through the cargo with the quick ' +
          'hands of people who have done this before. {name} arrives mid-theft. ' +
          '{?has_ally}{name} meets {ally:strongest}\'s eyes: one each, or both on the bigger one. ' +
          'No time to debate it.{/has_ally}' +
          '{?no_ally}Two of them, one of {name}. The thieves have not looked up yet.{/no_ally}',
        successAfterimage:
          '{name} reads the scene in the time it takes to draw steel — the merchant is pinned, ' +
          'the thieves are committed to the crate they\'re moving, and the road at {location} ' +
          'curves away from any easy escape. The approach is decided.',
        failureAfterimage:
          'By the time {name} understands the full geometry of the scene, the thieves have ' +
          'already grabbed the most valuable crate and are moving toward the treeline. ' +
          'The merchant is shouting directions that are no longer useful.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.05,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#combat'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
        narrativeTemplate:
          'The thieves draw short blades when they see {name} — they would rather fight ' +
          'for the haul than run empty-handed and explain the failure to whoever sent them.',
        successAfterimage:
          '{name} puts both thieves to flight before the merchant has stopped shouting. ' +
          'The goods are recovered, the driver is freed from the traces, ' +
          'and the grateful merchant produces a name worth writing down.',
        failureAfterimage:
          'The thieves hold their ground long enough to matter. They escape with half the goods ' +
          'and {name} is left helping the merchant count what remains, ' +
          'which is a more useful thing to do than pursuing them into the dark.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} interrupts a caravan robbery near {location}.',
      success: 'The thieves are driven off and the merchant is freed.',
      failure: 'The thieves escape with the goods. The merchant is left with what remains.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A merchant rescued on the road near {location} is a debt that will be remembered ' +
          'in the form of rates, routes, and introductions — the currency of the frontier economy.',
        changes: [
          {
            id: 'caravan_thieves_merchant_debt',
            kind: 'reputation_tally',
            title: 'Merchant Road Interventions',
            detail: 'Merchant network reputation — built one rescue and one shared risk at a time.',
            polarity: 'positive',
          },
        ],
        reactionPrompt: 'What does the god take from this rescue?',
        reactions: [
          {
            id: 'caravan_thieves_merchant_tally',
            label: 'A merchant rescued. A debt established.',
            intent:
              'Frontier merchants remember the people who helped them. ' +
              'The name {name} gave today will recirculate in caravanserai talk ' +
              'and will eventually be attached to a useful reputation.',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.merchant_rescues', delta: 1 },
              {
                kind: 'recent_event',
                message: '{name} drives off caravan thieves near {location} and recovers the merchant\'s goods.',
                significance: 0.4,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'caravan_thieves_intel',
            label: 'The merchant knows who uses this road. The thieves knew who to target.',
            intent:
              'Caravan thieves do not pick random wagons — they have information about contents and schedules. ' +
              'The merchant who was targeted knows something about why they were chosen.',
            effects: [
              {
                kind: 'intelligence',
                category: 'faction_position',
                label: 'Caravan robbery near {location} — targeted, not opportunistic',
                detail:
                  'The merchant confirms this is not the first attempt on this route. ' +
                  'Someone with route knowledge is selling it to the bandits.',
                reliability: 0.65,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 7. Smuggler's Stash (easy, steal → read) ───────────────────────────────
  {
    id: 'borderland.smugglers_stash',
    name: 'Smuggler\'s Stash',
    rarityTier: 2,
    intrinsicTier: 'background',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['ruins', 'camp', 'wilderness'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['honesty_cunning', 'asceticism_extravagance'],
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Fresh bootprints leading off the path at {location}, toward a section of collapsed wall ' +
          'that is supposed to be unremarkable. {name} stops and reads the trail: three people, ' +
          'heavy loads going in, light loads coming out, recent enough that the mud has not settled. ' +
          'Behind the rubble — crates that do not belong in ruins.',
        successAfterimage:
          '{name} catalogues the stash before touching anything: goods marked with false merchant seals, ' +
          'a ledger folded inside a waxed cloth, a name repeated on three of the crates. ' +
          'Someone will be back for these. That is useful to know before deciding what to take.',
        failureAfterimage:
          'The cache is better hidden than expected — {name} finds a few loose items near the entrance ' +
          'but the real stash is deeper, and the trail goes cold before the wall.',
      },
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#shadow'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#shadow'],
          },
        },
        narrativeTemplate:
          'Footsteps on the path — the smugglers are returning. {name} has maybe thirty seconds ' +
          'to decide: confront them at the wall, take the evidence and vanish, or leave without ' +
          'touching anything and come back with better preparation.',
        successAfterimage:
          '{name} slips away through the wall\'s far side with the ledger and enough of the marked goods ' +
          'to prove the operation. The smugglers return to find their stash compromised and the ledger gone. ' +
          'The name written in that ledger is now a debt owed to {name}.',
        failureAfterimage:
          'The smugglers round the wall with better timing than {name} expected. ' +
          'They give chase long enough to make the point, and {name} escapes empty-handed, ' +
          'having learned the location and the schedule but nothing else.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} discovers a smuggler\'s cache near {location}.',
      success: '{name} takes the evidence and the ledger. The operation is compromised.',
      failure: 'The smugglers return before {name} can secure the evidence.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A smuggler\'s stash near {location} is a node in a network, not an accident. ' +
          'Whatever {name} took or learned here opens a line into something larger.',
        changes: [
          {
            id: 'smugglers_stash_intelligence',
            kind: 'intelligence',
            title: 'Smuggling Route at {location}',
            detail: 'Evidence of an active smuggling operation passing through this location.',
            polarity: 'positive',
          },
        ],
        reactionPrompt: 'What does the god mark about what was found here?',
        reactions: [
          {
            id: 'smugglers_stash_intel_record',
            label: 'The ledger names carry weight. Record them.',
            intent:
              'A smuggling ledger is a map of who is moving what, where, and for whom. ' +
              '{name} now holds a piece of that map — the question is who to sell it to, ' +
              'or whether to use it directly.',
            effects: [
              {
                kind: 'intelligence',
                category: 'faction_position',
                label: 'Smuggling ledger recovered near {location}',
                detail:
                  'Names, quantities, and delivery points for an active supply operation. ' +
                  'At least one name is someone with local authority who should not be on this list.',
                reliability: 0.8,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'smugglers_stash_seed_contact',
            label: 'The smugglers will want their ledger back. Or an arrangement.',
            intent:
              'A smuggling operation that loses its records has two options: ' +
              'eliminate the person who took them, or negotiate. The size of this operation ' +
              'will determine which option they prefer — and the delay before they make contact.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'negotiation',
                delayTicks: 24,
                priority: 0.7,
                seedLabel: 'The smugglers whose ledger {name} took near {location} have located {them} and want to talk.',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  WILD BEASTS & NATURAL THREATS (6 templates)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 8. Feral Dogs (trivial, duel) ──────────────────────────────────────────
  {
    id: 'borderland.feral_dogs',
    name: 'Feral Dog Pack',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'farmland', 'ruins', 'ruined_village'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Three dogs emerge from the collapsed building near {location} — ribs visible under matted fur, ' +
          'moving in the low, spread formation of animals that learned to work together because they had to. ' +
          'They circle {name} without committing, testing the margins of what {they} will tolerate.',
        successAfterimage:
          '{name} stamps forward with a shout, body language all forward momentum. ' +
          'The pack leader flinches, and the rest follow it into retreat — the calculation shifts ' +
          'from "this looks like prey" to "this is more expensive than it looked."',
        failureAfterimage:
          'The dogs sense the hesitation before {name} does. One darts in from the side ' +
          'and closes on {their} calf before {name} can turn. The pack reads the outcome ' +
          'as a partial success and presses harder.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#beast'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The dogs regroup fifteen feet back, emboldened by the first retreat. ' +
          'The pack leader is the brindle one — slower than the others, but the one the rest watch. ' +
          '{name} has a clear read on the geometry of this now.',
        successAfterimage:
          'A stone catches the brindle dog squarely on the shoulder. ' +
          'It yelps and breaks away, and the pack loses its nerve in the same moment — ' +
          'scattering into the brush in three separate directions.',
        failureAfterimage:
          'The pack circles twice more before hunger decides it is not worth the risk. ' +
          '{name} passes through, marked by teeth, watching the tree line ' +
          'until the ruins are well behind.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} is confronted by a feral dog pack at {location}.',
      success: 'The pack scatters. The path is clear.',
      failure: 'The pack loses interest eventually. {name} moves on, bitten and wary.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Feral dogs near a ruined settlement at {location} are a symptom — ' +
          'something collapsed here and the dogs adapted. The building they came out of ' +
          'probably holds more than just animals.',
        changes: [
          {
            id: 'feral_dogs_tally',
            kind: 'reputation_tally',
            title: 'Beast Encounters',
            detail: 'The tally of animal threats handled on the borderland — small, but it accumulates.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note here?',
        reactions: [
          {
            id: 'feral_dogs_beast_tally',
            label: 'One more handled.',
            intent:
              'The borderland runs on capability that is never formally recognized — ' +
              'the people who clear the paths, deal with the animals, make the roads passable. ' +
              '{name} is adding to that record.',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.beasts_handled', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 9. Territorial Boar (easy, duel) ───────────────────────────────────────
  {
    id: 'borderland.territorial_boar',
    name: 'Territorial Boar',
    rarityTier: 2,
    intrinsicTier: 'background',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'farmland'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The undergrowth at {location} explodes without warning — a massive boar, ' +
          'tusks scarred from old fights, aimed directly at {name} with the single-minded ' +
          'commitment of an animal that has learned charging works. ' +
          'It is bigger than expected, and moving faster.',
        successAfterimage:
          '{name} sidesteps the charge at the last moment and the boar plows past, ' +
          'crashing into a thicket with enough momentum to take out a tree-trunk before stopping. ' +
          'It wheels around, slower now, reevaluating.',
        failureAfterimage:
          'The boar catches {name} with a glancing blow of its shoulder — enough mass to take {them} off {their} feet. ' +
          'The tusks miss, but the impact leaves {name} on the ground with the boar already turning for another pass.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#beast'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.01,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#beast'],
          },
        },
        narrativeTemplate:
          'The boar wheels and snorts, pawing at the earth, deciding. ' +
          'Its territory includes this path. {name} is either a threat worth pressing ' +
          'or something to be outlasted — the boar is working out which.',
        successAfterimage:
          '{name} holds ground and holds eye contact. The boar paws twice more ' +
          'and then turns away with a final snort — the calculation resolved in {name}\'s favor. ' +
          'The path through its territory is open.',
        failureAfterimage:
          'The boar charges again, and this time {name} takes to a tree. ' +
          'The animal circles the base twice, confirms its territory is intact, ' +
          'and leaves. {name} climbs down when the sound of it fades.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} is charged by a territorial boar near {location}.',
      success: 'The boar retreats. The path through its territory is open.',
      failure: 'The boar has the ground. {name} finds another route.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A territorial boar at {location} is a feature of the landscape, ' +
          'not a problem to be solved — it will be here next season and the one after. ' +
          'The question is whether {name}\'s read of it was correct.',
        changes: [
          {
            id: 'boar_beast_tally',
            kind: 'reputation_tally',
            title: 'Beast Encounters',
            detail: 'The tally of borderland animal confrontations.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god mark about this?',
        reactions: [
          {
            id: 'boar_beast_handled',
            label: 'The animal is still alive. The path is open. Acceptable.',
            intent:
              'A territorial boar driven off is not dead — it will charge the next traveler. ' +
              'But the road at {location} is passable for now, and sometimes that is enough.',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.beasts_handled', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 10. Venomous Serpent (trivial, duel) ───────────────────────────────────
  {
    id: 'borderland.venomous_serpent',
    name: 'Venomous Serpent',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'eye',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'ruins', 'camp'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A dry rattle from the rocks beside the trail at {location} — low and urgent, ' +
          'the sound of something coiled and patient that has decided its space is being invaded. ' +
          '{name}\'s next step would have landed exactly where the serpent is waiting.',
        successAfterimage:
          '{name} freezes mid-stride, weight still on the back foot. ' +
          'The serpent is right there — a hand\'s breadth from where the boot was going, ' +
          'hood beginning to flare, committed to a strike that has not yet committed to a target.',
        failureAfterimage:
          'Too late — the serpent strikes before {name} can correct the step. ' +
          'The fangs graze the boot leather, not skin, but the close call is close enough ' +
          'to leave {them} standing very still for a long moment afterward.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#beast'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The serpent rears now, hood flared, committed to the defense. ' +
          'The trail is too narrow to simply go around — the rocks on both sides ' +
          'funnel everything through the same three feet of path.',
        successAfterimage:
          'A swift, precise strike pins the serpent behind the head. ' +
          '{name} moves it off the trail and continues, one danger removed ' +
          'from a path that will be traveled again tomorrow by someone less careful.',
        failureAfterimage:
          'The serpent strikes and {name} pulls back fast enough. ' +
          'The long detour around through the bracken adds time to the journey ' +
          'and leaves {them} checking every rock for the rest of the afternoon.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} nearly steps on a venomous serpent on the trail at {location}.',
      success: 'The serpent is dealt with. The trail is clear.',
      failure: 'The serpent holds the trail. {name} takes the long way around.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Venomous serpents at {location} are a fact of the terrain, not an event. ' +
          'The path is either clear or it is not.',
        changes: [
          {
            id: 'serpent_tally',
            kind: 'reputation_tally',
            title: 'Beast Encounters',
            detail: 'Borderland animal encounters handled.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note?',
        reactions: [
          {
            id: 'serpent_beast_tally',
            label: 'The path is clear for travelers who follow.',
            intent:
              'Someone who knows the trails at {location} knows where the serpent rocks are. ' +
              '{name} now knows one more thing about this stretch of road.',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.beasts_handled', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 11. Wolves at Dusk (easy, duel) ────────────────────────────────────────
  {
    id: 'borderland.wolves_at_dusk',
    name: 'Wolves at Dusk',
    rarityTier: 2,
    intrinsicTier: 'background',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'camp', 'farmland'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The firelight at {location} catches the eyes first — green, then gone, then back again. ' +
          'The wolves arrived while the fire was being built, drawn by the smell of food or the warmth ' +
          'or the particular vulnerability of stopping for the night. ' +
          '{?has_ally}{name} and {ally:strongest} take opposite sides of the fire, ' +
          'backs to the flame, watching different sections of the dark.{/has_ally}' +
          '{?no_ally}{name} keeps the fire high and {their} back against a boulder. ' +
          'Four pairs of eyes visible. Probably more.{/no_ally}',
        successAfterimage:
          '{name} keeps the fire built and the light wide. The wolves probe the perimeter twice ' +
          'and find no easy angle — the rock at {name}\'s back takes one approach off the table, ' +
          'and the fire makes the others expensive. They settle into waiting.',
        failureAfterimage:
          'A wolf darts in from behind — the dark angle, the one the fire does not reach. ' +
          '{name} turns too slowly and the pack reads it. ' +
          'Blood is drawn before the animal retreats, and the pack presses harder.',
      },
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#beast'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#beast'],
          },
        },
        narrativeTemplate:
          'The pack has a center — a grey alpha, older than the rest, sitting just at the edge of the light. ' +
          'The others watch it. If it loses conviction, they lose conviction. ' +
          '{name} can see it clearly. The question is what to do with that.',
        successAfterimage:
          '{name} hurls a burning brand directly at the alpha — not a warning throw, but aimed. ' +
          'The animal yelps and breaks, and the pack\'s nerve goes with it, ' +
          'dissolving into the darkness in separate directions.',
        failureAfterimage:
          'The wolves have patience that the fire does not. They settle in and wait. ' +
          '{name} spends the night feeding wood into the fire and does not sleep, ' +
          'and at dawn the pack withdraws as if they had simply lost interest.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} is stalked by a wolf pack at their camp near {location}.',
      success: 'The pack breaks and scatters. The night is clear.',
      failure: 'The wolves wait out the night. {name} survives exhausted.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A wolf pack near {location} has a territory, a pattern, and a memory. ' +
          'This encounter is the first entry in a record that runs both ways — ' +
          '{name} now knows this pack\'s ground.',
        changes: [
          {
            id: 'wolves_beast_tally',
            kind: 'reputation_tally',
            title: 'Beast Encounters',
            detail: 'Borderland predator encounters — the tally of frontier nights.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god mark about the wolves and this place?',
        reactions: [
          {
            id: 'wolves_territory_tally',
            label: 'A pack encountered, a night survived.',
            intent:
              'The borderland keeps count of who has learned which paths are safe after dark. ' +
              '{name} has added to that knowledge at {location}.',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.beasts_handled', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'wolves_seed_return',
            label: 'This pack knows this campsite. They will come back next season.',
            intent:
              'Wolf packs have territories that persist across seasons. ' +
              'The same hex near {location} will see this pack again after winter, ' +
              'and they will remember a fire that drove them off.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'borderland',
                delayTicks: 72,
                priority: 0.5,
                seedLabel: 'The wolf pack from {location} returns to their winter territory — {name} is on that ground again.',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 12. Giant Spider Nest (easy, explore → read) ───────────────────────────
  {
    id: 'borderland.spider_nest',
    name: 'Giant Spider Nest',
    rarityTier: 2,
    intrinsicTier: 'background',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['ruins', 'wilderness', 'ruined_tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence', 'revelation_discretion'],
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The first sign is the silence at {location} — no insects, no birds, nothing that belongs ' +
          'in the web of ordinary sound. The second sign is the webs: gossamer at first, ' +
          'then thicker between the crumbled pillars, anchored at angles no common spider would bother with. ' +
          '{name} stops and lets the geometry of the place resolve.',
        successAfterimage:
          '{name} traces the web structure backward from the visible strands to the dense center, ' +
          'finds the three corridors through the ruin where no thread connects, ' +
          'and maps a path to the far side that does not cross anything with tension in it.',
        failureAfterimage:
          'A strand catches {name}\'s sleeve at shoulder height — light contact, ' +
          'but the vibration travels through the web instantly, ' +
          'and something in the dark interior of the ruin stops moving.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.6, condition: 0.4 },
            tagFilters: ['#combat'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
        narrativeTemplate:
          'The spider is larger than a hunting dog, legs moving with the particular deliberateness ' +
          'of something that does not need to hurry because nothing in these ruins ever runs from it. ' +
          'It emerges from the shadow between two fallen columns and stops, ' +
          'assessing {name} with all eight eyes.',
        successAfterimage:
          '{name} drives the creature back with fire and bladed force — ' +
          'the web burns fast and hot, the nest structure collapses behind the retreating spider, ' +
          'and the ruin fills with smoke that drives everything else out with it.',
        failureAfterimage:
          'The spider retreats deeper into the ruin rather than fighting in the burning outer section, ' +
          'and {name} retreats in the other direction. Some ruins are defended and will stay that way.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} discovers a giant spider nest in ruins at {location}.',
      success: 'The nest is burned. The ruin is accessible.',
      failure: 'The spider retreats to the deeper ruin. {name} withdraws.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A spider nest in the ruins at {location} is both a hazard and a reason why ' +
          'those ruins have not been picked clean — the nest keeps looters out as effectively as any lock.',
        changes: [
          {
            id: 'spider_nest_tally',
            kind: 'reputation_tally',
            title: 'Beast Encounters',
            detail: 'Predator encounters in the borderland ruins.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note about the ruins?',
        reactions: [
          {
            id: 'spider_nest_beast_tally',
            label: 'A nest cleared, a ruin opened.',
            intent:
              'Ruins guarded by predators hold things — stored goods, old caches, ' +
              'the remains of whatever made the ruin worth building. ' +
              '{name} has now opened access to what is there.',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.beasts_handled', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'spider_nest_intel_ruin',
            label: 'The nest was there for a reason — the ruin has something inside it.',
            intent:
              'Predators nest where there is sustained food. The ruins at {location} have enough ' +
              'traffic — rats, birds, the occasional traveler — to sustain a nest this size. ' +
              'There is something worth investigating in what the spider was guarding.',
            effects: [
              {
                kind: 'intelligence',
                category: 'location',
                label: 'Ruins at {location} — accessible after spider nest removal',
                detail:
                  'The ruin interior was undisturbed for as long as the nest kept people out. ' +
                  'The interior may hold intact stores, old records, or structural evidence of what stood here.',
                reliability: 0.55,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 13. Swamp Lurker (easy, duel) ──────────────────────────────────────────
  {
    id: 'borderland.swamp_lurker',
    name: 'Swamp Lurker',
    rarityTier: 2,
    intrinsicTier: 'background',
    reach: 'eye',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'oasis'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The water at {location} is too still. Not calm — still in the specific way of a surface ' +
          'that has had all its ordinary movement displaced by something large beneath it. ' +
          'Bubbles rise in a line, then stop. {name} reads the surface the way you read a face ' +
          'that is trying not to show what it is thinking.',
        successAfterimage:
          '{name} catches the faintest displacement — a ridge of backed-up water ' +
          'moving toward the crossing point in a line no current would explain. ' +
          'The lurker is there, patient, and {name} has seen it first.',
        failureAfterimage:
          'The water erupts without warning — the lurker was closer than the stillness suggested. ' +
          '{name} stumbles backward into the muck, losing the crossing entirely.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.05,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#beast'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#beast'],
          },
        },
        narrativeTemplate:
          'The creature rises from the shallows — scaled, low-slung, built along a line of pure ' +
          'muscle with jaws at one end and a tail at the other that can take the legs off a horse. ' +
          'The footing at the crossing is soft mud and submerged root, ' +
          'and the lurker has been fighting in it since birth.',
        successAfterimage:
          '{name} finds solid ground at the root of a waterside tree and works from there — ' +
          'steel where the scales are thinnest, at the neck and under the jaw. ' +
          'The lurker thrashes once and sinks back into the murk, and the crossing is quiet.',
        failureAfterimage:
          'The swamp defeats {name} before the creature does — every solid step turns soft, ' +
          'every stable hold pulls free. {name} retreats to dry land, mud-caked and wiser about this ford.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} encounters a swamp lurker at a crossing near {location}.',
      success: 'The lurker is driven off. The crossing is accessible.',
      failure: 'The lurker holds the crossing. {name} retreats to dry land.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A crossing point defended by a lurker at {location} affects everyone who uses that route — ' +
          'travelers, supply lines, and whoever owns the road all have an interest in this animal.',
        changes: [
          {
            id: 'swamp_lurker_tally',
            kind: 'reputation_tally',
            title: 'Beast Encounters',
            detail: 'Predator encounters at borderland crossings.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god mark about the crossing?',
        reactions: [
          {
            id: 'swamp_lurker_beast_tally',
            label: 'A crossing cleared, or confirmed impassable.',
            intent:
              'Whoever controls the safe crossings in borderland terrain controls movement. ' +
              '{name} has now added this one to the map, in one status or another.',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.beasts_handled', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  SCAVENGERS & RUINS (4 templates)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 14. Carrion Birds (trivial, duel) ──────────────────────────────────────
  {
    id: 'borderland.carrion_birds',
    name: 'Carrion Bird Flock',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'battleground', 'farmland'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Oversized carrion birds descend in a loud, ragged cloud near {location} — ' +
          'wings wide enough to shadow the path, emboldened by something dead or dying nearby. ' +
          '{name} is between them and what they want, and they have decided {they} might be part of it.',
        successAfterimage:
          '{name} cracks a wing with a well-aimed stone and the flock lifts, screaming. ' +
          'They circle once at height, reconsidering, and drift toward easier options.',
        failureAfterimage:
          'The birds are not deterred by noise or movement — hunger has made them persistent. ' +
          '{name} takes a dozen scratches from beaks and talons before they lose interest ' +
          'and turn back to whatever drew them here.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#beast'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The flock circles overhead, deciding whether to wait {name} out. ' +
          'They are watching the pack — if {name} can secure it against a dive, ' +
          'the birds will move on. If not, they have all day.',
        successAfterimage:
          '{name} covers the supplies under a blanket, lights a small smoky branch, ' +
          'and holds still. The flock drifts toward the battleground smell to the south ' +
          'where the carrion is already confirmed.',
        failureAfterimage:
          'One bird snatches a wrapped parcel and is gone before {name} can react. ' +
          'Minor loss. The flock takes it as a signal and the rest follow.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} is mobbed by a carrion bird flock near {location}.',
      success: 'The flock disperses. Supplies intact.',
      failure: 'The birds take what they can. Small loss, noted.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Carrion birds at {location} in numbers like this mean something has recently died nearby — ' +
          'or is in the process. The birds are symptoms of something worth investigating.',
        changes: [
          {
            id: 'carrion_birds_tally',
            kind: 'reputation_tally',
            title: 'Beast Encounters',
            detail: 'Borderland animal threats handled.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god mark about the birds?',
        reactions: [
          {
            id: 'carrion_birds_beast_tally',
            label: 'Managed. Move on.',
            intent:
              'Carrion birds are not a threat — they are information. ' +
              'What drew them to {location} is the question worth following.',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.beasts_handled', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'carrion_birds_intel_dead',
            label: 'Something died here recently. Find out what.',
            intent:
              'A flock this size does not gather for a rabbit. ' +
              'There is a significant kill site nearby — animal, human, or something in between. ' +
              'The answer matters to understanding what is moving through {location}.',
            effects: [
              {
                kind: 'intelligence',
                category: 'location',
                label: 'Recent large kill site near {location}',
                detail:
                  'The carrion birds gathered at {location} were drawn by something substantial. ' +
                  'The kill site — its age, type, and cause — will tell a different story ' +
                  'depending on what is found.',
                reliability: 0.6,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 15. Ruins Scavengers (easy, duel) ──────────────────────────────────────
  {
    id: 'borderland.ruins_scavengers',
    name: 'Ruins Scavengers',
    rarityTier: 2,
    intrinsicTier: 'background',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['ruins', 'ruined_village', 'ruined_city', 'ruined_tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence', 'honesty_cunning'],
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Figures are crouch-working among the rubble at {location}, prying cut stones from the walls ' +
          'with the practiced efficiency of people who have been doing this long enough to have tools for it. ' +
          'They see {name} and reach for weapons without breaking their posture — ' +
          'the transition of people who have had this conversation before. ' +
          '{?has_ally}{name} and {ally:strongest} have the numbers here, which changes the calculus immediately.{/has_ally}' +
          '{?no_ally}Three of them, one of {name}. They know these ruins, and that is its own kind of advantage.{/no_ally}',
        successAfterimage:
          '{name} steps forward with blade drawn and does not say anything. ' +
          'The scavengers exchange glances with the efficiency of people who have priced this fight correctly. ' +
          'They put the tools down and go.',
        failureAfterimage:
          'The scavengers hold their ground — they know which walls are still stable, ' +
          'which alcoves lead nowhere, which piles of rubble will not shift underfoot. ' +
          '{name} does not have that map.',
      },
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#ancient'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#ancient'],
          },
        },
        narrativeTemplate:
          'The main group retreated but the ruins go deeper — there may be more scavengers in the interior, ' +
          'or worse. {name} follows the sound of boots retreating into the dark chambers.',
        successAfterimage:
          'The last scavenger flees through a broken wall into the daylight on the far side. ' +
          'The ruins are empty now, and {name} has first read of what remains inside — ' +
          'the good things the scavengers had not yet gotten to.',
        failureAfterimage:
          '{name} gets turned around in the dark interior — the ruins are a maze of partial floors ' +
          'and collapsed corridors, and the scavengers knew the layout. ' +
          '{name} exits from a different opening than {they} entered, ' +
          'with only dust on {their} boots to show for it.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} confronts looters working the ruins at {location}.',
      success: 'The scavengers are cleared. {name} has first access to what remains.',
      failure: 'The scavengers know the ruins better. {name} exits empty-handed.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Scavengers working ruins at {location} are a sign that the site is known and assessed — ' +
          'someone sent them, or word has spread about what is here.',
        changes: [
          {
            id: 'ruins_scavengers_cleared',
            kind: 'reputation_tally',
            title: 'Road and Ruin Incidents',
            detail: 'Conflicts at borderland ruins — cleared or contested.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god mark about the ruins?',
        reactions: [
          {
            id: 'ruins_scavengers_tally',
            label: 'A contested ruin, an outcome recorded.',
            intent:
              'Ruins that are actively being stripped are running out of time. ' +
              '{name} has changed the timeline at {location} today — for better or worse.',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.road_threats_cleared', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ruins_scavengers_intel',
            label: 'What were they after? Someone assessed this site first.',
            intent:
              'Organized scavenging does not start without a survey. ' +
              'Someone identified what is worth taking at {location} before sending workers. ' +
              'That someone has better information about this ruin than {name} does.',
            effects: [
              {
                kind: 'intelligence',
                category: 'location',
                label: 'Ruin at {location} — assessed and being stripped',
                detail:
                  'The scavengers were sent by someone who surveyed the site. ' +
                  'The items they were prioritizing reveal what that survey found — ' +
                  'and what was considered worth the organized effort.',
                reliability: 0.65,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 16. Restless Bones (easy, duel) ────────────────────────────────────────
  {
    id: 'borderland.restless_bones',
    name: 'Restless Bones',
    rarityTier: 2,
    intrinsicTier: 'background',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['ruins', 'battleground', 'ruined_village'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'entropy',
    motivations: ['courage_prudence', 'mercy_ruthlessness'],
    steps: [
      {
        reach: 'veil',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The soil at {location} shifts where no wind touches it. A skeletal hand claws free, ' +
          'dragging itself upright with the particular slowness of old bones finding old purpose. ' +
          'Then another. The binding that holds them together is old and worn — ' +
          'older than the settlement that fell here, patient as the rot that followed it.',
        successAfterimage:
          '{name} reads the binding — the way the joints move, the pattern of the assembly, ' +
          'the signature of whatever compulsion stitched them back into motion. ' +
          'The binding is weak. These bones barely hold.',
        failureAfterimage:
          'The dead rise faster than {name}\'s read of the situation. ' +
          'The binding is stronger than the age of the bones suggests, ' +
          'and {name} is surrounded before drawing steel.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.05,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#ancient'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#ancient'],
          },
        },
        narrativeTemplate:
          'Three skeletons close in with weapons that have not rusted because they have not been touched — ' +
          'preserved inside the same binding that kept the bones from returning to dust. ' +
          'The weapons are real and sharp. The skeletons are less so, but there are three.',
        successAfterimage:
          '{name} shatters the lead skeleton at the knee joint, and the binding — ' +
          'distributed across all three — loses its anchor. ' +
          'The others collapse in the same moment, old bones scattering across the ground.',
        failureAfterimage:
          'The bones keep coming. {name} retreats from the cursed ground ' +
          'before the geometry of three-against-one turns irreversible, ' +
          'leaving the dead to their patrol of whatever they are guarding.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} disturbs restless bones at {location}.',
      success: 'The binding breaks. The bones return to stillness.',
      failure: 'The dead hold this ground. {name} retreats.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Restless bones at {location} are the product of something that happened here long ago ' +
          'and was not properly finished. The binding did not appear on its own.',
        changes: [
          {
            id: 'restless_bones_witness',
            kind: 'hidden_mark',
            title: 'Witnessed the Old Dead',
            detail: '{name} has seen what the old binding produces. That knowledge has texture.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god mark about this encounter with the old dead?',
        reactions: [
          {
            id: 'restless_bones_mark_witness',
            label: '{name} has seen old entropy at work. That is not nothing.',
            intent:
              'The dead that walk at {location} are a sign of unfinished business — ' +
              'a battle, a massacre, a binding laid by someone who is themselves long dead. ' +
              'What {name} witnessed here is a fact that will surface again when context arrives.',
            effects: [
              {
                kind: 'hidden_mark',
                key: 'borderland.witnessed_old_binding',
                label: 'Witnessed an old entropy binding animating bones at {location}',
                hidden: false,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'restless_bones_intel_site',
            label: 'The binding came from somewhere. Find the anchor.',
            intent:
              'Restless bones require a binding, and bindings have anchors — a buried object, ' +
              'a cursed site, a name carved into something still standing. ' +
              'The anchor at {location} is still active, which means the binding will reassemble.',
            effects: [
              {
                kind: 'intelligence',
                category: 'location',
                label: 'Active entropy binding at {location} — anchor unlocated',
                detail:
                  'The bones that rose at {location} are bound by something still present at the site. ' +
                  'Destroying the anchor would end the binding permanently. ' +
                  'Leaving it will produce the same encounter again.',
                reliability: 0.8,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 17. Will-o-Wisp Trail (trivial, explore → read) ────────────────────────
  {
    id: 'borderland.wisp_trail',
    name: 'Will-o\'-the-Wisp Trail',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['wilderness', 'oasis', 'ruins'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'spirit',
    motivations: ['revelation_discretion', 'courage_prudence'],
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A pale blue light bobs through the trees near {location} — too steady for firefly, ' +
          'too cold for torch, too deliberate to be weather. It pauses when {name} stops. ' +
          'It resumes when {name} moves. It wants to be followed, or it wants {name} to think it does. ' +
          'Those are different things, and the difference matters.',
        successAfterimage:
          '{name} follows at distance, watching the light\'s behavior at each obstacle — ' +
          'it threads the gaps between trees rather than floating through them, ' +
          'which is the behavior of something with a destination rather than a lure.',
        failureAfterimage:
          'The light dances away into the bog before {name} can read its pattern, ' +
          'and {name} finds {themselves} ankle-deep in mud with no path back that matches the one in.',
      },
      {
        reach: 'veil',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 0.5, bestowed_power: 0.5 },
            tagFilters: ['#divine'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The wisp stops above a mossy stone at the edge of a clearing — ' +
          'not natural stone, cut stone, something placed here deliberately ' +
          'and then allowed to sink. It pulses twice and waits.',
        successAfterimage:
          '{name} finds a weathered offering cache beneath the stone — ' +
          'small things, coins and carved tokens and a folded piece of cloth that does not rot. ' +
          'The wisp fades as {name}\'s hand closes around the first token, ' +
          'its purpose discharged.',
        failureAfterimage:
          'The wisp blinks out when {name} reaches the stone, ' +
          'and {name} digs for a long time in the cold ground without finding anything but roots and clay. ' +
          'Whatever was here has been here too long.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} follows a will-o\'-wisp near {location}.',
      success: 'The wisp leads {name} to an old offering cache.',
      failure: 'The wisp vanishes. The destination, if there was one, stays hidden.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A will-o\'-wisp at {location} is either a hazard, a guide, or a remnant of something ' +
          'that used to know the difference. The cache — if found — is a relic of whoever placed it.',
        changes: [
          {
            id: 'wisp_spirit_tally',
            kind: 'reputation_tally',
            title: 'Supernatural Encounters',
            detail: 'Contact with borderland spirit phenomena.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god mark about the wisp and the cache?',
        reactions: [
          {
            id: 'wisp_spirit_note',
            label: 'The wisp led somewhere. Note what it showed.',
            intent:
              'A spirit that guides rather than lures is either residual behavior from a long-dead custodian, ' +
              'or it has a current purpose. Either way, the cache at {location} was hidden for a reason.',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.supernatural_encounters', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'wisp_seed_cache_origin',
            label: 'Who left the cache? And why does the wisp still tend it?',
            intent:
              'An offering cache maintained by a spirit that has survived the person who made it ' +
              'suggests either a very old compact or a very persistent purpose. ' +
              'The items in the cache name a culture, a practice, or a specific person worth finding.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'investigation',
                delayTicks: 36,
                priority: 0.45,
                seedLabel: 'The offering cache found at {location} with the wisp\'s guidance is connected to something that still exists.',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  MINOR SUPERNATURAL / FRONTIER (3 templates)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 18. Goblin Foragers (trivial, duel) ────────────────────────────────────
  {
    id: 'borderland.goblin_foragers',
    name: 'Goblin Foragers',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'farmland', 'camp', 'ruins'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A cluster of small figures near {location} freeze in place when they notice {name} — ' +
          'caught mid-reach for a mushroom cluster, sacks half-full of foraged goods, ' +
          'eyes wide with the particular alertness of creatures that have learned to treat ' +
          'everything larger than themselves as a potential threat. ' +
          'Three of them. Maybe four. They are waiting to see what {name} does.',
        successAfterimage:
          '{name} shouts and stamps forward. The goblins scatter instantly, ' +
          'abandoning the sacks in a panic — not even pausing to grab what they came for. ' +
          'The clearing is empty before the echo fades.',
        failureAfterimage:
          'One goblin in the back has a stronger nerve than the rest — ' +
          'it hurls a rock with surprising accuracy and the others take that as the signal ' +
          'to scatter in controlled retreat rather than outright flight. ' +
          'They vanish into the bracken with most of their haul.',
      },
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#combat'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'Two goblins are hiding behind a fallen log, chittering at each other — ' +
          'the noise of creatures working up the courage to do something they have already ' +
          'decided is probably a bad idea. Pebbles rain from that direction, ' +
          'which is either threat or conversation.',
        successAfterimage:
          '{name} walks directly toward the log and the last goblins bolt mid-argument, ' +
          'disappearing into the undergrowth in opposite directions. ' +
          'The foraged mushrooms are left behind in a neat pile.',
        failureAfterimage:
          'The goblins are surprisingly stubborn — they have decided this clearing is theirs ' +
          'and {name} is the intruder in it. {name} takes the alternate path, ' +
          'leaving the foragers to their mushrooms.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} stumbles onto goblin foragers at {location}.',
      success: 'The goblins scatter. The area is clear.',
      failure: 'The goblins hold their ground. {name} takes another path.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Goblins foraging near {location} are a symptom of a warren close enough to exploit ' +
          'these resources — and close enough that the foragers will be back.',
        changes: [
          {
            id: 'goblin_foragers_tally',
            kind: 'reputation_tally',
            title: 'Frontier Incidents',
            detail: 'Minor supernatural encounters handled on the borderland.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note?',
        reactions: [
          {
            id: 'goblin_foragers_note',
            label: 'Goblins foraging this far out means a warren nearby.',
            intent:
              'Goblins do not forage beyond walking distance of their warren. ' +
              'The mushroom grounds at {location} are within their daily range, ' +
              'which narrows where the warren can be.',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.supernatural_encounters', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 19. Plague Rat Swarm (easy, duel) ──────────────────────────────────────
  {
    id: 'borderland.plague_rats',
    name: 'Plague Rat Swarm',
    rarityTier: 2,
    intrinsicTier: 'background',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['ruins', 'hamlet', 'camp', 'ruined_village'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'entropy',
    motivations: ['courage_prudence', 'sacrifice_survival'],
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A carpet of matted fur and glinting eyes boils up from the cellar opening at {location} — ' +
          'plague rats, dozens of them, moving with the collective purpose of things that are individually small ' +
          'and collectively an argument for leaving. Each one carries the particular matted-fur sheen ' +
          'of an animal that has been sick for longer than is sustainable.',
        successAfterimage:
          '{name} stamps and kicks at the vanguard, scattering the nearest rats back into the pack. ' +
          'Individual rats are nothing — it is the swarm that has weight, ' +
          'and the swarm is still deciding whether {name} is worth the collective effort.',
        failureAfterimage:
          'The rats are faster than expected and have more angles than {name} can cover — ' +
          'over boots, through the pack, around both sides simultaneously. ' +
          '{name} flails and retreats to the doorway, buying space to reassess.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#beast'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#beast'],
          },
        },
        narrativeTemplate:
          'The nest is below — a crawling mass in the dark that the swarm keeps retreating toward. ' +
          'Fire would end it cleanly, but this building has been dry for three seasons ' +
          'and the walls are tinder. {name} must manage the burn.',
        successAfterimage:
          'A controlled burn through the cellar floor — contained, methodical, watched until it char-stops. ' +
          'The rats scatter into the walls and the courtyard and the street, ' +
          'but the nest is ash and the plague source with it.',
        failureAfterimage:
          'The fire goes wider than planned and {name} has to choose between the nest and the building. ' +
          '{name} pulls back to let the fire die on its own, ' +
          'and the nest survives behind the scorched section of floor.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} confronts a plague rat swarm at {location}.',
      success: 'The nest is burned. The swarm scatters without a center.',
      failure: 'The nest survives. The plague continues to spread from {location}.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A plague rat nest at {location} is a public health event in slow motion — ' +
          'the settlement nearest this site will notice the rats spreading outward ' +
          'over the next few days, whether the nest was cleared or not.',
        changes: [
          {
            id: 'plague_rats_outcome',
            kind: 'reputation_tally',
            title: 'Public Health Interventions',
            detail: 'Actions taken against disease vectors on the borderland — visible to local settlements.',
            polarity: 'positive',
          },
        ],
        reactionPrompt: 'What does the god mark about the nest?',
        reactions: [
          {
            id: 'plague_rats_public_tally',
            label: 'The nearest settlement will notice what happened here.',
            intent:
              'Plague rats spreading from a nest at {location} would reach the nearest hamlet ' +
              'within a week. Someone dealing with the nest is visible to whoever lives downwind of it.',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.public_good', delta: 1 },
              {
                kind: 'recent_event',
                message: '{name} handles a plague rat nest at {location}.',
                significance: 0.35,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'plague_rats_seed_spread',
            label: 'If the nest survived, the plague spreads to the next settlement.',
            intent:
              'An untreated nest at {location} is a slow-moving threat — the rats will follow ' +
              'the food sources outward, and the nearest populated site will notice within days.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'borderland',
                delayTicks: 18,
                priority: 0.6,
                seedLabel: 'The plague rat nest near {location} has spread — the nearest settlement is reporting illness.',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 20. Camp Raiders (easy, duel) ──────────────────────────────────────────
  {
    id: 'borderland.camp_raiders',
    name: 'Camp Raiders',
    rarityTier: 2,
    intrinsicTier: 'background',
    reach: 'shadow',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['camp', 'farmland', 'wilderness'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A crash in the dark — something overturning in the supply area at {location}. ' +
          '{name} rolls from the bedroll, hand on hilt before fully awake, ' +
          'listening to the shape of the sound in the dark. ' +
          '{?has_ally}{ally:strongest} is already on {their} feet across the fire — ' +
          'awake faster, or just a lighter sleeper.{/has_ally}' +
          '{?no_ally}Alone. Someone rummaging through the supplies, not bothering to be quiet, ' +
          'which means they think {name} is asleep or they do not care.{/no_ally}',
        successAfterimage:
          '{name} moves silently into position — downwind, away from the embers, ' +
          'into the dark that the raiders are not watching. ' +
          'Two figures crouched over the supply crates, fully committed to what they are doing.',
        failureAfterimage:
          '{name} kicks a pot in the dark and the sound carries. ' +
          'The raiders hear it and grab what they can in the next three seconds, ' +
          'which is more than {name} expected them to grab.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.05,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.6, condition: 0.4 },
            tagFilters: ['#combat'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
        narrativeTemplate:
          'The raiders draw short blades when they see they are caught — ' +
          'they would rather fight for the haul than run empty-handed. ' +
          'In the dark and close quarters, {name} cannot afford to wait for them to decide together.',
        successAfterimage:
          '{name} puts the first raider down fast enough that the second stops calculating. ' +
          'The second one throws up {their} hands. The camp is secure, ' +
          'the supplies are intact, and {name} has a raider to question.',
        failureAfterimage:
          'The raiders are quick and they move in practiced coordination — ' +
          'one holds {name}\'s attention while the other grabs and runs. ' +
          'They escape with half the supplies and the night closes behind them.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name}\'s camp at {location} is raided in the night.',
      success: 'The camp is secured. The raiders are caught or driven off.',
      failure: 'The raiders escape with half the supplies.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A camp raided at night near {location} is not opportunistic — ' +
          'they watched the camp before deciding it was worth the approach. ' +
          'Someone was close enough to observe, and chose tonight.',
        changes: [
          {
            id: 'camp_raiders_night_watch',
            kind: 'reputation_tally',
            title: 'Night Encounters',
            detail: 'Borderland camp defense — the record of who is alert on the road.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god mark about the raid?',
        reactions: [
          {
            id: 'camp_raiders_tally',
            label: 'A camp defended. Supplies intact or not.',
            intent:
              'Surviving a night raid without casualty is a baseline competence on the borderland. ' +
              '{name}\'s handling of it goes into the record.',
            effects: [
              { kind: 'reputation_tally', key: 'borderland.road_threats_cleared', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'camp_raiders_seed_watched',
            label: 'They knew this camp was here. Someone watched before they moved.',
            intent:
              'Camp raiders who time a night approach well have done reconnaissance. ' +
              'The route {name} is traveling near {location} has been observed — ' +
              'possibly by the same people, possibly by someone who sold the information.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'borderland',
                delayTicks: 12,
                priority: 0.5,
                seedLabel: 'The camp raiders near {location} were scouted — whoever sent them is still watching the route.',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

];

// ─── Lookup ──────────────────────────────────────────────────────────────────

/**
 * Look up a borderland encounter template by ID.
 * Returns undefined if not found — callers should use getAnyEncounterById instead.
 */
export function getBorderlandEncounterById(id: string): UnifiedActionTemplate | undefined {
  return BORDERLAND_ENCOUNTER_TEMPLATES.find(t => t.id === id);
}
