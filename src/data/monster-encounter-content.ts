/**
 * Monster Encounter Content — Phase 4 migration to UnifiedActionTemplate (THR-103).
 *
 * Five templates covering monster threats: lair hunts (minor + named elite),
 * wilderness ambushes, lair defense (army scale), and horde raids on
 * settlements (story-beat tier).
 *
 * Each template rewrites legacy EncounterTemplate prose to the Threadbare
 * aesthetic bar — sensory-first openings, enrichment placeholders for
 * identity and possession, conditional blocks on faction/artifact/ally —
 * and adds authored aftermath with monster-specific consequences:
 *
 *   • Hidden marks for witnessed combat ("she saw the dragon's eye and
 *     did not look away" / scars and creature knowledge)
 *   • Encounter seeds for territorial returns (the predator that escaped,
 *     the lair that will rebuild, the horde that scattered)
 *   • Intelligence grants on lore won through near-defeat
 *   • emit_omen on horde outcomes (heroism / atrocity stains the region)
 *   • update_node GraphOps on lair_defense and horde_raid for world-mutating
 *     property changes (prosperity, defense, magicalSaturation)
 *
 * Registration: spread into UNIFIED_ACTION_TEMPLATES via unified-action-templates.ts.
 * Lookup function getMonsterEncounterById preserved for backward compat with
 * encounter-content.ts getAnyEncounterById fallback chain.
 *
 * NFP #1: All difficulty values are named constants (Tunability).
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';

// ─── Tunable Constants ──────────────────────────────────────────────────────

/** Base difficulty for a minor monster hunt — scout step (Eye). */
const MINOR_HUNT_SCOUT_DIFFICULTY = 0.25;

/** Drive-out step for minor hunt — combat under prepared conditions. */
const MINOR_HUNT_DRIVE_DIFFICULTY = 0.35;

/** Approach step for named elite — careful reconnaissance against dangerous prey. */
const ELITE_HUNT_APPROACH_DIFFICULTY = 0.45;

/** Confrontation step for named elite — sustained combat with a legendary creature. */
const ELITE_HUNT_CONFRONTATION_DIFFICULTY = 0.60;

/** Final reckoning for named elite — climax against a wounded beast at full fury. */
const ELITE_HUNT_RECKONING_DIFFICULTY = 0.75;

/** Sense step for wilderness ambush — perception under pressure. */
const AMBUSH_SENSE_DIFFICULTY = 0.35;

/** Repel step for wilderness ambush — sustained close combat. */
const AMBUSH_REPEL_DIFFICULTY = 0.45;

/** Formation step for lair defense — group cohesion under first impact. */
const LAIR_DEFENSE_FORMATION_DIFFICULTY = 0.40;

/** Drive-through step for lair defense — pushing into a defended hold. */
const LAIR_DEFENSE_DRIVE_DIFFICULTY = 0.55;

/** Organize step for horde raid — rallying a settlement under threat. */
const HORDE_RAID_ORGANIZE_DIFFICULTY = 0.55;

/** First-wave step for horde raid — holding the breach. */
const HORDE_RAID_REPEL_DIFFICULTY = 0.70;

/** Drive-back step for horde raid — the climactic counterpush. */
const HORDE_RAID_DRIVE_DIFFICULTY = 0.80;

/** Prosperity damage to a settlement when the horde is repelled at cost (THR-103). */
const HORDE_RAID_SURVIVOR_PROSPERITY_HIT = -8;

/** Prosperity damage when the horde overruns the settlement. */
const HORDE_RAID_DEVASTATION_PROSPERITY_HIT = -25;

/** Defense rating reduction on a lair after defenders are driven through. */
const LAIR_DEFENSE_DEFENSE_REDUCTION = -10;

// ─── Templates ──────────────────────────────────────────────────────────────

export const MONSTER_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [
  // ── monster.hunt.minor ─────────────────────────────────────────────────────
  {
    id: 'monster.hunt.minor',
    name: 'Clear the Minor Lair',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['lair', 'wilderness'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: MINOR_HUNT_SCOUT_DIFFICULTY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The approaches to the lair are written in the ground at {location} — ' +
          'claw-furrows in the moss, a midden of cracked bone arranged the way an animal arranges things ' +
          '(by where it dropped them, not by intent). {name} crouches and reads. ' +
          'The freshest tracks angle in from the south. Something is at home. ' +
          '{?has_faction}The guild bounty was specific about the body count — three farmers, one drover, ' +
          'a child whose name {name} was made to memorize. That kind of brief is meant to focus the work.{/has_faction}' +
          '{?no_faction}No bounty, no handler waiting for a report. ' +
          'Only a clearing emptied of birdsong, and the certainty that {name} is the one standing in it.{/no_faction}',
        successAfterimage:
          '{name} finds the back-route — a narrow seam in the rock where the beast cannot wedge itself, ' +
          'and where a careful approach gives one clean second of advantage.',
        failureAfterimage:
          'The entrances knot together in the dark. {name} chooses one and commits, ' +
          'aware that the wrong choice has already been made.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: MINOR_HUNT_DRIVE_DIFFICULTY,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.65, condition: 0.25, bestowed_power: 0.10 },
            tagFilters: ['#beast'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.05,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#beast'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'Steel rings against the lair-mouth and the beast comes — slower than {name} expected, ' +
          'which means it has been hurt before and still chose to live here. ' +
          'The cavern is too low to swing wide. Every motion has to be paid for in inches. ' +
          '{?has_artifact}{name} sets {artifact:weapon} between {them} and the creature\'s teeth. ' +
          'The blade has been here before, in some other shape. It knows what to do.{/has_artifact}' +
          '{?no_artifact}{name} works with what {they} brought. ' +
          'The beast is strong, but the room is small and the angles are knowable.{/no_artifact}',
        successAfterimage:
          'The creature folds onto its own weight and is quiet. {name} stays low for a long count ' +
          'before approaching — habit, learned the hard way — then begins the work of making sure.',
        failureAfterimage:
          'The blow that should have ended it didn\'t, and the cavern is suddenly the wrong shape ' +
          'for the situation. {name} backs out leaving blood on the floor, some of it {their} own. ' +
          'The beast keeps the lair for now. It will remember the smell.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} closes on a marked lair near {location}, hunting a single creature.',
      success: 'The lair is cleared. The creature that lived there will not threaten the road again.',
      failure: 'The lair held. {name} leaves wounded, and the beast has new measurements to remember.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The lair near {location} is what {name} made it — emptied, or not. ' +
          'Either outcome leaves a residue: the corpse that needs handling, ' +
          'or the beast that has now seen a hunter and survived.',
        changes: [
          {
            id: 'minor_hunt_outcome',
            kind: 'reputation_tally',
            title: 'Beast-Hunter Tally',
            detail: 'A lair confronted, an outcome on the ledger. The hunting reputation accumulates one engagement at a time.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the engagement?',
        reactions: [
          {
            id: 'minor_hunt_record_kill',
            label: 'Mark this as the work the world expects of {name}.',
            intent:
              'Beast-hunting is repetition. One lair is a chore; ten is a profession. ' +
              'The god draws a tally line for {name}, the way a butcher counts the day\'s work.',
            effects: [
              {
                kind: 'reputation_tally',
                key: 'beasts_hunted',
                delta: 1,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'minor_hunt_seed_return',
            label: 'The lair will not stay empty.',
            intent:
              'Wilderness fills the spaces hunters clear. ' +
              'Within a season, something else will move into the cave — a juvenile of the same species, ' +
              'a different predator that was waiting for the territorial fight to end. The god remembers the address.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'monster.hunt.minor',
                delayTicks: 40,
                priority: 0.7,
                seedLabel: 'A new beast has moved into the lair {name} cleared',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'minor_hunt_creature_lore',
            label: '{name} learned how this kind of beast dies.',
            intent:
              'There is a way the body folded that {name} did not see coming, and a way the breath went out ' +
              'that {they} will recognise next time. Knowledge of how a thing dies is rarer than knowledge of how it lives.',
            effects: [
              {
                kind: 'intelligence',
                category: 'cultural_knowledge',
                label: 'Beast lore — minor lair predator',
                detail:
                  'The behaviour of the cave\'s occupant under pressure: where it favours its left flank, ' +
                  'how it commits when it commits, what sound it makes a half-beat before lunging. ' +
                  'Useful against the species, less useful against the individual.',
                reliability: 0.75,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── monster.hunt.named_elite ───────────────────────────────────────────────
  {
    id: 'monster.hunt.named_elite',
    name: 'The Named Beast',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['lair'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'force',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: ELITE_HUNT_APPROACH_DIFFICULTY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The creature has a name. That is the first thing about it — ' +
          'longer than {name}, older than any house in {location}, repeated in lullabies the way other places repeat saints. ' +
          'Hunters have come for it before. {name} has heard at least four of those names; ' +
          'the rest are not remembered, which is its own kind of warning. ' +
          '{?has_ally}Somewhere on the road home, {ally:strongest} is waiting to hear which name gets added to the song. ' +
          'That thought is not a comfort, but it is a weight, and weight is useful at this distance.{/has_ally}' +
          '{?no_ally}No witness. If this goes badly, the only person who will know how it went is the beast.{/no_ally}',
        successAfterimage:
          '{name} finds the resting chamber — the place where this thing has slept for so long that ' +
          'the rock is worn into the shape of it. The angle is good. The light, when it comes, will be on the right side.',
        failureAfterimage:
          'The lair is more cunning than the creature inside it. ' +
          '{name} arrives at the inner chamber with the wrong angle, the wrong breath, the wrong second.',
      },
      {
        reach: 'iron',
        duration: { min: 3, max: 3 },
        difficulty: ELITE_HUNT_CONFRONTATION_DIFFICULTY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The named beast does not roar at first. ' +
          'It looks at {name} the way an old dog looks at a familiar guest — recognition, almost — ' +
          'and then it does roar, and the sound is a thing {name} will hear in dreams for a long time. ' +
          '{?has_artifact}{artifact:weapon} sings against the cavern wall as {name} sets {their} guard. ' +
          'There is a reason famous weapons end up in the hands of people who are about to need them.{/has_artifact}' +
          '{?no_artifact}{name} has only what {they} brought. {They} chose to come anyway. ' +
          'That choice is part of the fight now.{/no_artifact}',
        successAfterimage:
          '{name} reads the openings as they come — not all at once, but in the order of small concessions ' +
          'that compound. The beast\'s body no longer holds itself the way it did at the start. The next minute will decide the next decade.',
        failureAfterimage:
          'The creature is bigger inside the cavern than its tracks made it look. ' +
          '{name} is driven against the rock and feels the shape of {their} own end touch {their} ribs. ' +
          'The beast does not press the kill — it has all the time in the world.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: ELITE_HUNT_RECKONING_DIFFICULTY,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { bestowed_power: 0.45, possession: 0.30, condition: 0.25 },
            tagFilters: ['#beast'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.18,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.65, possession: 0.35 },
            tagFilters: ['#beast'],
          },
          reputationDelta: -0.06,
        },
        narrativeTemplate:
          'Cornered, the creature changes shape — not literally, but in the way it holds itself. ' +
          'This is what it was made for, this last minute, and it has been saving the worst of itself for it. ' +
          '{name} has been saving things too. The cavern is small enough that one of them will not come back out.',
        successAfterimage:
          'The named beast is dead. The silence that follows is louder than the fight was. ' +
          '{name} stands among bones older than any kingdom, holding a weapon that is now famous in a different way.',
        failureAfterimage:
          'The beast slips deeper into the lair through a fissure {name} did not know about. ' +
          'It is wounded; it is also ancient, and an ancient wounded thing is the most dangerous version of itself.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} hunts the named beast at its ancestral lair near {location}.',
      success: 'The named beast is dead. {name}\'s name is now spoken in the same breath.',
      failure: 'The beast withdrew into the deep lair. It will be larger when {name} returns, and angrier.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A named creature has been moved against. ' +
          'Either the song that mentions it gains a verse, or the song that mentions {name} loses one — ' +
          'and either ending propagates outward in ways that don\'t care whether {name} wanted to be a legend.',
        changes: [
          {
            id: 'named_elite_legend_shift',
            kind: 'reputation',
            title: 'A Legend Engaged',
            detail: 'A named creature has been hunted. Whatever happened in the cavern will be told.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from this confrontation?',
        reactions: [
          {
            id: 'named_elite_witness_mark',
            label: '{name} stood eye-to-eye with the named thing.',
            intent:
              'There is a kind of looking that imprints itself on a person. ' +
              '{name} did not look away. That is a thing the world will register, and not all the registrations are comfortable.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: 0.55,
                label: 'Met the named beast and held the gaze',
                revealFamilies: ['monster.hunt', 'monster.encounter', 'tavern', 'court'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'named_elite_creature_lore',
            label: 'The beast taught what it could not help teaching.',
            intent:
              'Three minutes of close combat with a thing of that age is more knowledge than most chroniclers ' +
              'collect in a lifetime. {name} carries it out of the cavern like a wound that knows things.',
            effects: [
              {
                kind: 'intelligence',
                category: 'cultural_knowledge',
                label: 'Lore of a named elite predator',
                detail:
                  'The way the beast moved at full commitment, the cadences of its breath, ' +
                  'the precise sphere-tinted resonance of its roar. Useful against legends of its kind, ' +
                  'devastatingly useful against this individual if it surfaces again.',
                reliability: 0.92,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'named_elite_legend_grows',
            label: 'The story will not stay the size it is now.',
            intent:
              'A named beast confronted is a story that wants to keep growing. Tavern-singers will inflate it; ' +
              'rivals will resent it; older creatures of the same species will hear about the body and consider their own affairs. ' +
              'The god lets the rumour run.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'tavern',
                delayTicks: 18,
                priority: 0.9,
                seedLabel: 'Tavern songs about {name} and the named beast have started traveling',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'named_elite_creature_returns',
            label: 'If the beast lived, it remembers the face.',
            intent:
              'Failure here is not the end of the story; it is the start of a different story. ' +
              'Wounded, ancient, marked by one human in particular, the beast becomes a hunter in its turn.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'monster.hunt.named_elite',
                delayTicks: 35,
                priority: 1.1,
                seedLabel: 'The named beast has been seen again, and the wounds {name} gave it have not healed clean',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── monster.encounter.ambush ───────────────────────────────────────────────
  {
    id: 'monster.encounter.ambush',
    name: 'Wilderness Ambush',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: AMBUSH_SENSE_DIFFICULTY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The track through {location} carries the wrong silence. ' +
          'Birds aren\'t calling on the right side of the trees. The bracken to {name}\'s left has a stillness ' +
          'that ordinary stillness doesn\'t. {?has_ally}{ally:strongest} is half a day ahead, and that half-day ' +
          'is suddenly a country wide.{/has_ally}{?no_ally}There is no one to call out to. ' +
          '{name} has the half-second of warning that instinct provides, and not much else.{/no_ally}',
        successAfterimage:
          '{name} catches the movement before it lands — the angle of a haunch, the dilation of pupils ' +
          'in shadow. The half-second turns into a precious whole one, and a whole second can be lived in.',
        failureAfterimage:
          'The thing comes out of cover at the speed cover-things come out, ' +
          'and {name} is reaching for a weapon that is half-drawn when it arrives.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: AMBUSH_REPEL_DIFFICULTY,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.45, condition: 0.35, bestowed_power: 0.20 },
            tagFilters: ['#beast'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#beast'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'Open ground. No walls to use, no formation to hide behind. The predator works in arcs, ' +
          'and {name} has to read the next arc out of the shape of the last one. ' +
          '{?has_artifact}{artifact:weapon} answers in the rhythm of the predator\'s commitment — ' +
          'a working partnership, the kind that takes years to build and minutes to need.{/has_artifact}' +
          '{?no_artifact}{name} fights the way the wilderness teaches anyone who survives long enough: ' +
          'patiently, aware of {their} own breath, conceding ground in order to take it back.{/no_artifact}',
        successAfterimage:
          'The creature breaks off — not killed, but discouraged in the way wilderness predators are discouraged: ' +
          'thoroughly, and with the memory of the encounter intact. {name} stands in the trail listening to the birds come back.',
        failureAfterimage:
          'The beast withdraws on its own terms with a piece of {name} that did not used to be on the trail. ' +
          'It will go to ground for a few days. {name} will limp.',
      },
    ],
    narrativeTemplates: {
      initiation: 'A wilderness predator marks {name} on the path through {location}.',
      success: 'The creature is driven off. The path is quieter — for now.',
      failure: 'The predator broke off on its own terms. It has a face to remember now.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The wilds at {location} have either lost a predator or gained a memory. ' +
          'Wilderness keeps its own ledger, separate from human reckoning, and the entry has been made.',
        changes: [
          {
            id: 'ambush_outcome',
            kind: 'reputation_tally',
            title: 'Predator Ledger',
            detail: 'A wilderness encounter, one way or another. The wilds know whether {name} is prey or peer.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god draw from the trail?',
        reactions: [
          {
            id: 'ambush_creature_returns',
            label: 'The predator will be seen again.',
            intent:
              'A wilderness predator with a memory of a human is a predator that has work left undone. ' +
              'Whether it returns to claim a kill or to avoid this one, the territory has been marked.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'monster.encounter.ambush',
                delayTicks: 25,
                priority: 0.8,
                seedLabel: 'A predator with a memory of {name} has been moving in the wilderness near {location}',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ambush_wilderness_mark',
            label: 'The wilds know {name}\'s face now.',
            intent:
              'There is a register the wilderness keeps that no chronicler has ever transcribed. ' +
              '{name} is in it now — not as a name, but as a particular kind of presence. ' +
              'Other things in the woods will respond differently from this point forward.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: 0.30,
                label: 'The wilderness predators near {location} have logged {name}\'s scent and rhythm',
                revealFamilies: ['monster.encounter', 'monster.hunt', 'borderland'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── monster.encounter.lair_defense ─────────────────────────────────────────
  {
    id: 'monster.encounter.lair_defense',
    name: 'Lair Defenders',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    reach: 'iron',
    crudType: 'update',
    scale: 'regional',
    locationSubtypes: ['lair'],
    apCost: 1,
    actorAffinities: ['individual', 'group'],
    sphereAffinity: 'force',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        reach: 'stone',
        duration: { min: 2, max: 2 },
        difficulty: LAIR_DEFENSE_FORMATION_DIFFICULTY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The vanguard hits the lair-mouth and the creatures pour out of crevices the maps did not know existed. ' +
          'This is what {name} prepared for. Holding a line at a cave entrance is geometry, breath, and rehearsal — ' +
          'and the rehearsal happens in the seconds before the first wave arrives, not in the weeks before. ' +
          '{?has_faction}{name}\'s sergeants have been with the unit long enough to read the signal {they} give without thinking. ' +
          'The shields lock the way they have locked a hundred times.{/has_faction}' +
          '{?no_faction}This is a scratch unit, and scratch units learn cohesion at the cost of bodies. ' +
          '{name} commits to the line and hopes the line commits back.{/no_faction}',
        successAfterimage:
          'The first wave breaks against the formation {name} held in place. Shields scrape on shields, ' +
          'screaming becomes ordered counting, and the line holds long enough for the second wave to be a problem rather than a catastrophe.',
        failureAfterimage:
          'The vanguard scatters around {name}. Discipline does not survive the first contact, ' +
          'and a scatter at a cave mouth is not the same as a scatter on open ground — there are no fall-back lanes here.',
      },
      {
        reach: 'iron',
        duration: { min: 3, max: 3 },
        difficulty: LAIR_DEFENSE_DRIVE_DIFFICULTY,
        failBehavior: 'fail_action',
        onSuccess: [
          {
            op: 'update_node',
            nodeId: '$target',
            changes: { defense: { delta: LAIR_DEFENSE_DEFENSE_REDUCTION } },
          },
        ],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { bestowed_power: 0.40, possession: 0.30, condition: 0.30 },
            tagFilters: ['#beast'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.10,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
            tagFilters: ['#beast'],
          },
          reputationDelta: -0.07,
        },
        narrativeTemplate:
          'The second wave is the lair\'s body itself: defenders that have been raised in this dark, ' +
          'that know which corners narrow and which widen at running speed. ' +
          'Every meter of progress is paid for in a name {name} will have to remember later. ' +
          '{?has_artifact}{artifact:weapon} carries the work — wide arcs in the wider chambers, ' +
          'short economical cuts in the choke-points.{/has_artifact}',
        successAfterimage:
          'The lair is taken. The cost is in the wounded sitting against the cavern wall and the dead being arranged for the carry. ' +
          '{name} walks the chambers and counts both, because counting is a discipline that keeps the next campaign honest.',
        failureAfterimage:
          'The drive falters. {name} calls the withdrawal — the only call left — and the column threads back out of the lair ' +
          'in shorter ranks than it went in with. The defenders do not pursue, which is its own kind of judgment.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} commits a force into the defended lair at {location}.',
      success: 'The lair is taken. The chambers will have to be re-secured before they can be left.',
      failure: 'The lair held. The unit withdraws shorter than it went in.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The lair near {location} has been moved against by an organized force. ' +
          'Either it has been gutted, or the attempt has marked it as a place that knows how to defend itself.',
        changes: [
          {
            id: 'lair_defense_outcome',
            kind: 'reputation_tally',
            title: 'Lair Engagement',
            detail: 'An organized assault on a lair, with consequences that will outlive the day.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god mark from the assault?',
        reactions: [
          {
            id: 'lair_defense_record_command',
            label: '{name} commanded under cave-fire and the line held.',
            intent:
              'Leadership in close terrain is a different skill than leadership on a field, and the difference shows. ' +
              'The god enters the engagement on the ledger of {name}\'s command record.',
            effects: [
              {
                kind: 'reputation_tally',
                key: 'lairs_engaged',
                delta: 1,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lair_defense_seed_rebuild',
            label: 'The lair will not stay empty long.',
            intent:
              'A defended lair, once cleared, draws other inhabitants — opportunists, juveniles seeking territory, ' +
              'the offspring of whatever held the place before. The god lets the season run.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'monster.hunt.minor',
                delayTicks: 50,
                priority: 0.7,
                seedLabel: 'Something has moved into the cleared lair near {location}',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lair_defense_mark_defeat',
            label: 'The lair learned the assault tactics.',
            intent:
              'Defenders that survive an organized attack remember it. ' +
              'They reshape the tunnels; they post sentries where they did not before. ' +
              'A second attempt will face a more careful enemy.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: 0.45,
                label: 'The lair defenders at {location} have studied {name}\'s tactics',
                revealFamilies: ['monster.encounter', 'monster.hunt'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── monster.encounter.horde_raid ───────────────────────────────────────────
  {
    id: 'monster.encounter.horde_raid',
    name: 'The Horde at the Gates',
    rarityTier: 4,
    intrinsicTier: 'story_beat',
    reach: 'iron',
    crudType: 'update',
    scale: 'regional',
    locationSubtypes: ['hamlet', 'town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual', 'group'],
    sphereAffinity: 'entropy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        reach: 'stone',
        duration: { min: 2, max: 2 },
        difficulty: HORDE_RAID_ORGANIZE_DIFFICULTY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The horns from the watch towers are still echoing when {name} reaches the square at {location}. ' +
          'There are hours, not days. The horde is hours away, and the difference between a settlement that survives ' +
          'and one that becomes a place-name on a map is decided in the next two of them. ' +
          '{?has_faction}The militia knows {name}\'s voice. Orders carry without repetition; ' +
          'old drill takes over, the way it is supposed to.{/has_faction}' +
          '{?no_faction}This is a town that did not expect to need {name}, and it shows. ' +
          '{They} give{s} orders into faces that are listening for the first time, ' +
          'and the first time is not when listening is at its best.{/no_faction}',
        successAfterimage:
          'The barricades go up under {name}\'s direction — not perfect, never perfect, but enough. ' +
          'Bowmen find the rooflines they were told to find. The militia threads through the lanes ' +
          'and reaches its assigned positions. The horde is welcome to come now.',
        failureAfterimage:
          'Panic outpaces {name}\'s orders. Doors get barred against neighbors. ' +
          'The defense, when it forms, forms in the wrong shape, and the wrong shape is a thing the horde will read on arrival.',
      },
      {
        reach: 'iron',
        duration: { min: 3, max: 3 },
        difficulty: HORDE_RAID_REPEL_DIFFICULTY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The first wave hits the gate as a single mass, then breaks against the wood and resolves into individual creatures, ' +
          'each one a problem with its own arc and its own intentions. {name} fights at the breach because the breach is the worst place ' +
          'and the worst place is where command has to be visible. ' +
          '{?has_artifact}{artifact:weapon} answers each commitment with the precision of long use. ' +
          'Famous weapons earn their fame at moments like this; some of them are about to earn more.{/has_artifact}',
        successAfterimage:
          'The first wave falters. Creatures pull back from the gate not because they are commanded to ' +
          'but because the cost has registered in whatever passes for their reckoning. ' +
          'Behind {name}, defenders are still standing. That is more than nothing; in the next minutes it may be everything.',
        failureAfterimage:
          'The breach widens. {name} falls back through the inner streets, organizing what defense can still be organized. ' +
          'Houses behind {them} are no longer defended; the horde is in them.',
      },
      {
        reach: 'iron',
        duration: { min: 3, max: 3 },
        difficulty: HORDE_RAID_DRIVE_DIFFICULTY,
        failBehavior: 'fail_action',
        onSuccess: [
          {
            op: 'update_node',
            nodeId: '$target',
            changes: { prosperity: { delta: HORDE_RAID_SURVIVOR_PROSPERITY_HIT } },
          },
        ],
        onFailure: [
          {
            op: 'update_node',
            nodeId: '$target',
            changes: { prosperity: { delta: HORDE_RAID_DEVASTATION_PROSPERITY_HIT } },
          },
        ],
        successMetadata: {
          rewardPool: {
            categoryWeights: { bestowed_power: 0.55, condition: 0.25, possession: 0.20 },
            tagFilters: ['#beast'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.20,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
            tagFilters: ['#beast'],
          },
          reputationDelta: -0.12,
        },
        narrativeTemplate:
          'The settlement\'s fate is in the next push, and there are not many pushes left in any of the bodies still standing. ' +
          '{name} calls a counter — a line that has to hold long enough for the horde to decide that this is no longer worth what it costs. ' +
          'The line forms. The line is asked.',
        successAfterimage:
          'The horde breaks against {name}\'s line. Not killed, mostly — driven into the wilderness in pieces small enough to scatter. ' +
          '{location} stands. The cost is in the streets that will not be lit tonight and the houses that will not be repaired by the same families that built them, ' +
          'but the settlement stands.',
        failureAfterimage:
          'The line buckles. The horde is in the inner streets and the survivors are already moving through the back alleys ' +
          'toward whatever country is open. {name} is among them, or {they} {is} not. ' +
          'Either way, the place that was {location} is no longer the same word.',
      },
    ],
    narrativeTemplates: {
      initiation: 'A horde closes on {location}. {name} has hours to make a settlement into a fortress.',
      success: '{location} stands. The cost is heavy, but the streets and the people are still {location}\'s.',
      failure: 'The horde overruns the settlement. {location} will be a place where survivors came from, not a place where they live.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A settlement has been hit by a horde. ' +
          'Whether {location} survived or did not, the region\'s weather has changed; ' +
          'omens shift around the news of it for a long time afterward.',
        changes: [
          {
            id: 'horde_raid_outcome',
            kind: 'shell_state',
            title: 'A Settlement Tested',
            detail: 'The kind of event that gets remembered in songs and used as a date in deeds.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god send into the world from this?',
        reactions: [
          {
            id: 'horde_raid_emit_heroism',
            label: 'The defense was a story worth carrying.',
            intent:
              'Successful defenses against hordes do something to the regional weather. ' +
              'Other settlements that hear about it become braver, or more anxious, or both at the same time. ' +
              'The god lets the omen run.',
            effects: [
              {
                kind: 'emit_omen',
                category: 'thematic_pressure',
                intensity: 0.55,
                narrativeHook: '{location} held against the horde — the story is moving outward through the region',
                scope: { kind: 'region' },
                sphereAlignment: 'force',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'horde_raid_emit_atrocity',
            label: 'A settlement was lost. The region knows.',
            intent:
              'A devastated settlement stains the regional fabric in a way that does not wash out for years. ' +
              'Other places measure themselves against the loss; some withdraw, some rearm, some leave entirely.',
            effects: [
              {
                kind: 'emit_omen',
                category: 'thematic_pressure',
                intensity: 0.75,
                narrativeHook: '{location} was overrun. The horde is still moving, and the region has new vocabulary for fear',
                scope: { kind: 'region' },
                sphereAlignment: 'entropy',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'horde_raid_witness_mark',
            label: '{name} watched the horde\'s shape, and the shape stayed in the eye.',
            intent:
              'There is a way a horde moves when it decides it has the numbers, ' +
              'and there is a way it moves when the cost has registered. {name} has now seen both. ' +
              'That seeing is a load no one in {location} carries quite the same way again.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: 0.65,
                label: 'Saw the horde at the gates of {location} and learned how it broke or did not',
                revealFamilies: ['monster.encounter', 'monster.hunt', 'tavern', 'court'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'horde_raid_seed_return',
            label: 'A scattered horde regathers somewhere else.',
            intent:
              'Hordes, broken or victorious, do not simply end. The remnant moves on; the news travels with it; ' +
              'a related creature in a different territory begins gathering its own. The god marks the trajectory.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'monster.encounter.horde_raid',
                delayTicks: 80,
                priority: 1.0,
                seedLabel: 'A new horde has been forming in the wilderness — possibly the same blood as the one that came to {location}',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Lookup ─────────────────────────────────────────────────────────────────

/**
 * Look up a monster encounter template by ID.
 * Returns undefined if not found — callers should use getAnyEncounterById instead.
 */
export function getMonsterEncounterById(id: string): UnifiedActionTemplate | undefined {
  return MONSTER_ENCOUNTER_TEMPLATES.find(t => t.id === id);
}
