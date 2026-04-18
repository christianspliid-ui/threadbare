/**
 * Rangers Brotherhood Encounter Content — unified format (THR-31 Phase 2c).
 *
 * Voice bible: terse, observant, the prose reads as if written by someone on watch.
 * Sentence fragments when moving. Fuller sentences when still. Present tense for
 * the observing beat. "sign", "trail", "track", "what the wild permits" carry the voice.
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { FactionEncounterMeta } from '../types/faction';
import {
  FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS,
  FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
} from './faction-constants';

// ─── Constants ───────────────────────────────────────────────────────────

const RB_DIFFICULTY_BASE = 25;
const RB_DIFFICULTY_STEP = 10;
const RB_SENIOR_BASE = 40;
const RB_ELITE_BASE = 55;
const RB_JOIN_DIFFICULTY = 20;
const RB_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const RANGERS_BROTHERHOOD_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  ['rb.join', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.0, questType: 'standard' }],
  ['rb.promotion', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.0, questType: 'standard' }],
  ['rb.quest.trail_patrol', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.04, questType: 'standard' }],
  ['rb.quest.track_beast', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.04, questType: 'standard' }],
  ['rb.quest.survey_border', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.04, questType: 'standard' }],
  ['rb.quest.clear_threat', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.05, questType: 'standard' }],
  ['rb.quest.wilderness_rescue', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.05, questType: 'standard' }],
  ['rb.senior.deep_scout', { factionDefId: 'rangers_brotherhood', minRank: 'ranger_captain', reputationReward: 0.06, questType: 'senior' }],
  ['rb.senior.ambush_raiders', { factionDefId: 'rangers_brotherhood', minRank: 'ranger_captain', reputationReward: 0.06, questType: 'senior' }],
  ['rb.senior.map_unknown', { factionDefId: 'rangers_brotherhood', minRank: 'ranger_captain', reputationReward: 0.06, questType: 'senior' }],
  ['rb.elite.monster_hunt', { factionDefId: 'rangers_brotherhood', minRank: 'lord_ranger', reputationReward: 0.08, questType: 'elite' }],
  ['rb.elite.frontier_defense', { factionDefId: 'rangers_brotherhood', minRank: 'lord_ranger', reputationReward: 0.08, questType: 'elite' }],
  ['rb.social.campfire_tales', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.02, questType: 'standard' }],
  ['rb.social.tracking_lesson', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.02, questType: 'standard' }],
  ['rb.social.equipment_trade', { factionDefId: 'rangers_brotherhood', minRank: 'scout', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Standard Quest Templates ─────────────────────────────────────────────

export const RANGERS_BROTHERHOOD_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'rb.quest.trail_patrol',
    name: 'Trail Patrol',
    locationSubtypes: ['town', 'camp', 'fort'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 3.0,
    steps: [
      {
        id: 'rb.quest.trail_patrol.1',
        name: 'Walk the Trail',
        narrativeTemplate: 'A stretch of trail out of {location}. {name} walks it reading sign — broken grass, old track, the wrong birdsong. What the wild permits, they read.',
        successAfterimage: 'The trail is clear. Sign of safe passage. Nothing moving that should not be.',
        failureAfterimage: 'Missed something. Something stirs in the undergrowth that had time to study {name} first.',
        reach: 'eye',
        difficulty: RB_DIFFICULTY_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'rb.quest.trail_patrol.2',
        name: 'Handle the Disturbance',
        narrativeTemplate: '{?has_faction}Movement off the trail. {name} draws and holds the bearing — the brotherhood\'s standing order when sign turns hostile.{/has_faction}{?!has_faction}Something in the tree line. {name} moves toward it. The wild permits this, or it does not.{/?!has_faction}',
        successAfterimage: 'Threat dealt with. Travelers will move safely now.',
        failureAfterimage: 'The threat slips back into cover. The trail goes cold. Report filed.',
        reach: 'iron',
        difficulty: (RB_DIFFICULTY_BASE + RB_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The brotherhood sends {name} out from {location} to walk what the wild permits travelers to walk.',
      success: 'The trail closes clean. No sign left that did not belong. The patrol is done.',
      failure: 'The sign was there. {name} misread it. The report uses the word "unresolved."',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'iron.positive', delta: 0.04 },
        { kind: 'recent_event', tag: 'rb_patrol' },
      ],
    },
  },

  {
    id: 'rb.quest.track_beast',
    name: 'Track a Beast',
    locationSubtypes: ['town', 'camp', 'fort'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'duel',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 3.0,
    steps: [
      {
        id: 'rb.quest.track_beast.1',
        name: 'Read the Signs',
        narrativeTemplate: 'Livestock gone near {location}. {name} goes to where the trail starts — a cold print in soft ground, a drag mark, the bearing it took into the hills.',
        successAfterimage: 'Tracks found. Two hours old, heading uphill. The wind will hold.',
        failureAfterimage: 'Rain washed the sign. The trail goes cold before {name} can read it.',
        reach: 'eye',
        difficulty: RB_DIFFICULTY_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'rb.quest.track_beast.2',
        name: 'Confront the Beast',
        narrativeTemplate: '{?has_faction}The lair, found. {name} draws. The wild permits one of them to leave.{/has_faction}{?!has_faction}The dark under trees. The thing that walked here is large. {name} takes the draw line.{/?!has_faction}',
        successAfterimage: 'The beast falls. Sign of safe passage resumes on that trail.',
        failureAfterimage: 'Fiercer than the track suggested. {name} withdraws with new knowledge of what the wild permits.',
        reach: 'iron',
        difficulty: (RB_DIFFICULTY_BASE + RB_DIFFICULTY_STEP + 5) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'Something is taking livestock from {location}. The brotherhood sends {name} to read the sign and end it.',
      success: 'The beast is gone. The trail is clear. What the wild permits has been negotiated.',
      failure: 'The beast escaped. The trail will circle back. It always circles back.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'iron.positive', delta: 0.04 },
        { kind: 'recent_event', tag: 'rb_track_beast' },
      ],
    },
  },

  {
    id: 'rb.quest.survey_border',
    name: 'Border Survey',
    locationSubtypes: ['camp', 'fort'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 3.0,
    steps: [
      {
        id: 'rb.quest.survey_border.1',
        name: 'Map the Terrain',
        narrativeTemplate: 'The brotherhood needs current maps of the borderland near {location}. {name} walks it ridge by ridge, noting every ravine and ridge line — what the wild permits a careful eye to see.',
        successAfterimage: 'Accurate maps. Every approach and obstacle recorded. Good ground knowledge.',
        failureAfterimage: 'Dense terrain. The coverage is partial. More field time needed.',
        reach: 'eye',
        difficulty: (RB_DIFFICULTY_BASE + 5) / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'rb.quest.survey_border.2',
        name: 'Report Findings',
        narrativeTemplate: '{?has_faction}Compile the observations. The captains will adjust deployments based on what {name} has found — what the wild permits, now in the brotherhood\'s books.{/has_faction}{?!has_faction}{name} writes the report. Sign read, bearing noted, trail conditions clear.{/?!has_faction}',
        successAfterimage: 'Thorough report. The captains nod. Good sign work.',
        failureAfterimage: 'Gaps in the detail. The report lacks the second observations.',
        reach: 'eye',
        difficulty: (RB_DIFFICULTY_BASE + RB_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The captains out of {location} need current maps. {name} walks the borderland.',
      success: 'Good maps. The captains adjust their line. What the wild permits is now known.',
      failure: 'Incomplete. The borderland has more to say. A second survey is being planned.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'eye.positive', delta: 0.04 },
        { kind: 'recent_event', tag: 'rb_survey' },
      ],
    },
  },

  {
    id: 'rb.quest.clear_threat',
    name: 'Clear the Threat',
    locationSubtypes: ['town', 'camp', 'fort'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 3.0,
    steps: [
      {
        id: 'rb.quest.clear_threat.1',
        name: 'Scout the Enemy',
        narrativeTemplate: 'A camp spotted near {location}. {name} goes to read its sign — how many, what bearing they hold, where their sentries stand.',
        successAfterimage: 'Numbers assessed. Vulnerable at dawn. The bearing is clear.',
        failureAfterimage: 'Alert sentries. Observation is difficult. The sign is harder to read than expected.',
        reach: 'eye',
        difficulty: RB_DIFFICULTY_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'rb.quest.clear_threat.2',
        name: 'Strike the Camp',
        narrativeTemplate: '{?has_faction}The brotherhood moves in before first light. {name} takes the draw line. The wild permits a practiced hand what it denies a careless one.{/has_faction}{?!has_faction}Strike fast. The track suggests they scatter if they see you coming.{/?!has_faction}',
        successAfterimage: 'The camp is cleared. The trail is safer. Sign of threat, gone.',
        failureAfterimage: 'Some scatter. The trail will need watching. The sign is fresh and heading east.',
        reach: 'iron',
        difficulty: (RB_DIFFICULTY_BASE + RB_DIFFICULTY_STEP + 5) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'Sign of a camp near {location}. The brotherhood sends {name} to assess and clear it.',
      success: 'The threat is gone. The trail is safe. Sign of the brotherhood\'s work, left where the wild permits.',
      failure: 'Some escaped. The sign says they know the area. A follow-up is being arranged.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'iron.positive', delta: 0.05 },
        { kind: 'recent_event', tag: 'rb_clear_threat' },
      ],
    },
  },

  {
    id: 'rb.quest.wilderness_rescue',
    name: 'Wilderness Rescue',
    locationSubtypes: ['town', 'camp'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 3.0,
    steps: [
      {
        id: 'rb.quest.wilderness_rescue.1',
        name: 'Find the Lost',
        narrativeTemplate: 'Travelers missing from {location}. {name} takes the last known bearing and reads the sign — broken grass, a dropped pack, the track of someone who did not know where they were going.',
        successAfterimage: 'Traces. Off-trail near the ravine. Two hours ahead, not yet in the deep country.',
        failureAfterimage: 'Too vast. No clear trail. The sign is scattered.',
        reach: 'eye',
        difficulty: (RB_DIFFICULTY_BASE + 5) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'rb.quest.wilderness_rescue.2',
        name: 'Bring Them Home',
        narrativeTemplate: '{?has_faction}What the wild permits, {name} navigates. The travelers are found. Now the bearing home, before what the dark under trees permits becomes the question.{/has_faction}{?!has_faction}{name} reaches the lost travelers. One bearing home, taken carefully.{/?!has_faction}',
        successAfterimage: 'Survivors found and returned. The brotherhood earns what it always earns: gratitude and no ceremony.',
        failureAfterimage: 'Too late. Only belongings remain. The sign of what happened is clear enough. The report will be grim.',
        reach: 'iron',
        difficulty: (RB_DIFFICULTY_BASE + RB_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'Travelers lost in the country around {location}. {name} goes to find the sign.',
      success: 'Found. Brought back. The wild permitted it. {name} does not mention the close part.',
      failure: 'Too late. The sign said everything. The report said less.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'eye.positive', delta: 0.05 },
        { kind: 'recent_event', tag: 'rb_rescue' },
      ],
    },
  },
];

// ─── Senior Quest Templates ───────────────────────────────────────────────

export const RANGERS_BROTHERHOOD_SENIOR_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'rb.senior.deep_scout',
    name: 'Deep Scout Mission',
    locationSubtypes: ['camp', 'fort'],
    rarityTier: 2,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 5.0,
    steps: [
      {
        id: 'rb.senior.deep_scout.1',
        name: 'Penetrate the Frontier',
        narrativeTemplate: 'Past the edge of the known maps. {name} goes beyond the charted territory out of {location} — what the wild permits past the last known bearing.',
        successAfterimage: 'New ground mapped. Unknown settlements noted. Sign of things the brotherhood did not know to look for.',
        failureAfterimage: 'Hostile terrain forces the retreat. Partial data. The map has a new edge marked: impassable.',
        reach: 'eye',
        difficulty: RB_SENIOR_BASE / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'rb.senior.deep_scout.2',
        name: 'Evade Hostiles',
        narrativeTemplate: '{?has_faction}The frontier is not empty. {name} moves through it on the bearing the wild permits, watched by things that have been here longer. The sign says: do not stop.{/has_faction}{?!has_faction}{name} moves unseen. The track doubles back twice before the extraction line is clear.{/?!has_faction}',
        successAfterimage: 'Clean extraction. Intelligence gained. The sign read correctly throughout.',
        failureAfterimage: 'Spotted. The trail circles back — the wild was listening while {name} walked it.',
        reach: 'iron',
        difficulty: (RB_SENIOR_BASE + RB_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The captains at {location} need what the deep country holds. {name} goes past what the known maps permit.',
      success: 'Good intelligence. Clean extraction. The map grows by what the wild permitted {name} to observe.',
      failure: 'Spotted and pursued. The map has a new note: what the wild does not permit.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'eye.positive', delta: 0.06 },
        { kind: 'hidden_mark', markType: 'secret_knowledge' as const, severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY },
        { kind: 'recent_event', tag: 'rb_deep_scout' },
      ],
    },
  },

  {
    id: 'rb.senior.ambush_raiders',
    name: 'Ambush the Raiders',
    locationSubtypes: ['camp', 'fort'],
    rarityTier: 2,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 5.0,
    steps: [
      {
        id: 'rb.senior.ambush_raiders.1',
        name: 'Set the Trap',
        narrativeTemplate: 'Raiders working the roads near {location}. {name} reads their trail and picks the ground — a ridge line, a draw, a place the wild permits a wait.',
        successAfterimage: 'The ground is chosen. Positions set. The bearing is clear. Now: the long hold.',
        failureAfterimage: 'The raiders changed route. The trail says they read the sign first.',
        reach: 'eye',
        difficulty: RB_SENIOR_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'rb.senior.ambush_raiders.2',
        name: 'Spring the Ambush',
        narrativeTemplate: '{?has_faction}The raiders walk into the ground {name} chose. The wild permits this exactly once per site — {name} has used it well.{/has_faction}{?!has_faction}The draw line holds. The ambush breaks what the trail built up.{/?!has_faction}',
        successAfterimage: 'Total surprise. The raiders are broken. Sign of organized resistance: gone.',
        failureAfterimage: 'They fight back. Losses on both sides. The trail will be cautious for a season.',
        reach: 'iron',
        difficulty: (RB_SENIOR_BASE + RB_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'Raiders on the roads from {location}. {name} goes to read their trail and find the ground where the wild permits an ambush.',
      success: 'The ambush held. The raiders are broken. The roads out of {location} are clear.',
      failure: 'The raiders fought well. The sign is complicated now. A second approach is forming.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'iron.positive', delta: 0.06 },
        { kind: 'recent_event', tag: 'rb_ambush' },
      ],
    },
  },

  {
    id: 'rb.senior.map_unknown',
    name: 'Map the Unknown',
    locationSubtypes: ['camp', 'fort'],
    rarityTier: 2,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 5.0,
    steps: [
      {
        id: 'rb.senior.map_unknown.1',
        name: 'Chart New Territory',
        narrativeTemplate: '{name} goes where no ranger from {location} has gone — the blank space on the map, the territory the wild permits only careful observers to cross.',
        successAfterimage: 'New lands charted. Rivers, passes, and landmarks. What the wild permitted to be seen.',
        failureAfterimage: 'Impassable terrain blocks the survey. Gaps in the map marked impassable.',
        reach: 'eye',
        difficulty: RB_SENIOR_BASE / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'rb.senior.map_unknown.2',
        name: 'Catalog the Resources',
        narrativeTemplate: '{?has_faction}Water sources, game trails, camp sites — what the wild permits the brotherhood to use. {name} catalogs it all. The map grows one careful observation at a time.{/has_faction}{?!has_faction}{name} notes the resources. Sign of what the territory can sustain.{/?!has_faction}',
        successAfterimage: 'A comprehensive guide. The brotherhood is enriched. The map knows more of what the wild permits.',
        failureAfterimage: 'Useful but incomplete. Follow-up expeditions will add what was missed.',
        reach: 'eye',
        difficulty: (RB_SENIOR_BASE + RB_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The brotherhood\'s maps have a blank space near {location}. {name} goes to read what the wild permits to be known.',
      success: 'Good maps. The blank space has sign now. What the wild permitted, recorded.',
      failure: 'The territory resisted. The map has new marks but also new gaps.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'eye.positive', delta: 0.06 },
        { kind: 'recent_event', tag: 'rb_map_unknown' },
      ],
    },
  },
];

// ─── Elite Quest Templates ────────────────────────────────────────────────

export const RANGERS_BROTHERHOOD_ELITE_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'rb.elite.monster_hunt',
    name: 'The Great Hunt',
    locationSubtypes: ['camp', 'fort'],
    rarityTier: 3,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 8.0,
    steps: [
      {
        id: 'rb.elite.monster_hunt.1',
        name: 'Track the Beast',
        narrativeTemplate: 'A legendary predator working the frontier around {location}. {name} reads its trail — days of sign, each print larger than expected, each bearing more deliberate.',
        successAfterimage: 'Days of tracking lead to the lair. The sign is old but the beast is large. Very large.',
        failureAfterimage: 'The trail doubles on itself. The beast has been reading {name}\'s sign while {name} read its.',
        reach: 'eye',
        difficulty: RB_ELITE_BASE / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'rb.elite.monster_hunt.2',
        name: 'Prepare the Kill',
        narrativeTemplate: '{name} studies the beast from the draw line. The sign suggests a weakness — a bearing it always favors, a place the wild permits approach from below.',
        successAfterimage: 'A vulnerability identified. The plan is clear. The bearing is set.',
        failureAfterimage: 'No obvious weakness in the sign. Brute force may be the only option the wild permits.',
        reach: 'eye',
        difficulty: (RB_ELITE_BASE + RB_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'rb.elite.monster_hunt.3',
        name: 'Slay the Beast',
        narrativeTemplate: '{?has_faction}Steel and nerve against fang and claw. What the wild permits {name}, it does not permit the beast. One bearing chosen. One outcome.{/has_faction}{?!has_faction}The draw. The thing that walked this trail for years faces {name} at last.{/?!has_faction}',
        successAfterimage: 'The beast falls. The sign of it will be told around fires. The trail is clear.',
        failureAfterimage: 'The beast escapes wounded. The sign says it is learning. It will be more dangerous now.',
        reach: 'iron',
        difficulty: (RB_ELITE_BASE + RB_DIFFICULTY_STEP * 2) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'A legendary predator has denied the frontier around {location} to the brotherhood long enough. {name} goes to read its trail and end it.',
      success: 'The beast is dead. The trail is clean. What the wild permits has shifted, by {name}\'s hand.',
      failure: 'The beast escaped. The trail doubles back. The sign is fresh and it knows the way.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'iron.positive', delta: 0.08 },
        { kind: 'hidden_mark', markType: 'secret_knowledge' as const, severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY },
        { kind: 'recent_event', tag: 'rb_elite_hunt' },
      ],
    },
  },

  {
    id: 'rb.elite.frontier_defense',
    name: 'Frontier Defense',
    locationSubtypes: ['fort'],
    rarityTier: 3,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'explore',
    apCost: 1,
    actorAffinities: ['individual'],
    questPriority: 8.0,
    steps: [
      {
        id: 'rb.elite.frontier_defense.1',
        name: 'Assess the Threat',
        narrativeTemplate: 'A large force moving on the frontier near {location}. {name} reads the sign — numbers, routes, timing. What the wild permits them to move through.',
        successAfterimage: 'Numbers and bearing assessed. A plan forms from the sign.',
        failureAfterimage: 'The force moves unpredictably. The sign is hard to read at this scale.',
        reach: 'eye',
        difficulty: RB_ELITE_BASE / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'rb.elite.frontier_defense.2',
        name: 'Coordinate the Rangers',
        narrativeTemplate: '{name} deploys the brotherhood squads to the ground the sign suggested — every chokepoint, every draw line, every place the wild permits a waiting force.',
        successAfterimage: 'Every approach covered. The defense is layered. The trail to {location} is closed.',
        failureAfterimage: 'Not enough rangers. The sign shows approaches that cannot be watched.',
        reach: 'eye',
        difficulty: (RB_ELITE_BASE + RB_DIFFICULTY_STEP) / 100,
        duration: { min: 2, max: 2 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
      },
      {
        id: 'rb.elite.frontier_defense.3',
        name: 'Hold the Line',
        narrativeTemplate: '{?has_faction}The assault comes from the bearing the sign predicted. {name} holds the ground. The wild permits this — one line of rangers against what is coming down the trail.{/has_faction}{?!has_faction}The line holds or it does not. {name} is on it.{/?!has_faction}',
        successAfterimage: 'The frontier holds. The enemy broke against the ground {name} chose. Sign of victory in the broken trail.',
        failureAfterimage: 'The defense buckles. Organized retreat. The sign says: secondary positions, now.',
        reach: 'iron',
        difficulty: (RB_ELITE_BASE + RB_DIFFICULTY_STEP * 2) / 100,
        duration: { min: 3, max: 3 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'A large force threatens the frontier. The brotherhood at {location} sends {name} to read the sign and hold what the wild permits to be held.',
      success: 'The frontier holds. The trail is clear again. What the wild permits, defended.',
      failure: 'The line fell back. The sign is complicated now. The brotherhood reassembles.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'iron.positive', delta: 0.08 },
        { kind: 'recent_event', tag: 'rb_frontier_defense' },
      ],
    },
  },
];

// ─── Social Encounter Templates ────────────────────────────────────────────

export const RANGERS_BROTHERHOOD_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'rb.social.campfire_tales',
    name: 'Campfire Tales',
    locationSubtypes: ['town', 'camp', 'fort'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'explore',
    apCost: 1,
    actorAffinities: ['individual'],
    steps: [
      {
        id: 'rb.social.campfire_tales.1',
        name: 'Share a Story',
        narrativeTemplate: '{?has_faction}Rangers gather at {location}. Fire. Each one shares a trail story — what the wild permitted, what it did not. {name} has a story worth telling.{/has_faction}{?!has_faction}{name} sits at the fire with the others. The old ritual of sign and trail, retold.{/?!has_faction}',
        successAfterimage: 'The story earns nods. The sign in it was real. Bonds strengthen.',
        failureAfterimage: 'The story fell flat. Too rehearsed. The fire crackles into silence.',
        reach: 'heart',
        difficulty: (RB_DIFFICULTY_BASE - 10) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The campfire at {location} draws rangers together. Tales of trail and track.',
      success: 'A good story. What the wild permitted {name} to see, now shared.',
      failure: 'Not tonight. The trail story had no sign worth reading.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'eye.positive', delta: 0.02 },
        { kind: 'recent_event', tag: 'rb_social' },
      ],
    },
  },

  {
    id: 'rb.social.tracking_lesson',
    name: 'Tracking Lesson',
    locationSubtypes: ['town', 'camp', 'fort'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    apCost: 1,
    actorAffinities: ['individual'],
    steps: [
      {
        id: 'rb.social.tracking_lesson.1',
        name: 'Teach or Learn',
        narrativeTemplate: '{?has_faction}A veteran ranger at {location} demonstrates. The sign is there — cold print, broken grass, the bearing an animal took six hours ago. {name} watches and reads.{/has_faction}{?!has_faction}{name} attends the lesson. What the wild permits a trained eye to find.{/?!has_faction}',
        successAfterimage: 'Useful techniques absorbed. The sign will be clearer on the next trail.',
        failureAfterimage: 'The lesson is lost today. The sign is showing what {name} cannot yet read.',
        reach: 'eye',
        difficulty: (RB_DIFFICULTY_BASE - 5) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'A tracking lesson at {location}. What the wild permits, learned one print at a time.',
      success: 'Good lesson. The sign is clearer now. The trail will give up more.',
      failure: 'Not today. The sign was there. {name} could not read it yet.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'eye.positive', delta: 0.02 },
        { kind: 'recent_event', tag: 'rb_social' },
      ],
    },
  },

  {
    id: 'rb.social.equipment_trade',
    name: 'Trade Equipment',
    locationSubtypes: ['town', 'camp', 'fort'],
    rarityTier: 1,
    crudType: 'encounter',
    scale: 'individual',
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    apCost: 1,
    actorAffinities: ['individual'],
    steps: [
      {
        id: 'rb.social.equipment_trade.1',
        name: 'Swap Gear',
        narrativeTemplate: '{?has_faction}Rangers at {location} barter surplus equipment. What the trail wears out, another ranger may have replaced. {name} trades what the last patrol proved unnecessary.{/has_faction}{?!has_faction}{name} swaps gear. An old bow for a better knife. The trade is practical.{/?!has_faction}',
        successAfterimage: 'Good trade. Better equipped for what the next trail requires.',
        failureAfterimage: 'Nothing worth trading today. The surplus is the wrong kind.',
        reach: 'eye',
        difficulty: (RB_DIFFICULTY_BASE - 5) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'continue',
        onSuccess: [],
        onFailure: [],
      },
    ],
    narrativeTemplates: {
      initiation: 'The rangers at {location} trade equipment between patrols.',
      success: 'A practical trade. What the trail needs next, {name} now has.',
      failure: 'Nothing useful in the pool today. {name} keeps the old gear.',
    },
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', key: 'eye.positive', delta: 0.02 },
        { kind: 'recent_event', tag: 'rb_social' },
      ],
    },
  },
];

// ─── Join & Promotion ─────────────────────────────────────────────────────

export const RB_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'rb.join',
  name: 'Join the Rangers Brotherhood',
  locationSubtypes: ['town', 'camp', 'fort'],
  rarityTier: 1,
  crudType: 'encounter',
  scale: 'individual',
  reachPrimary: 'eye',
  reachSecondary: 'iron',
  encounterType: 'explore',
  apCost: 1,
  actorAffinities: ['individual'],
  questPriority: 6.0,
  steps: [
    {
      id: 'rb.join.1',
      name: 'The Tracking Trial',
      narrativeTemplate: '{?has_faction}The brotherhood tests {name} in the field near {location} — a quarry set loose in rough country. Follow the trail and bring back sign.{/has_faction}{?!has_faction}{name} tracks through country the brotherhood chose. What the wild permits, demonstrated.{/?!has_faction}',
      successAfterimage: 'Quarry found. The trail read correctly. The brotherhood accepts a new scout.',
      failureAfterimage: 'Trail lost. The wilds are not yet {name}\'s to read.',
      reach: 'eye',
      difficulty: RB_JOIN_DIFFICULTY / 100,
      duration: { min: 1, max: 1 },
      failBehavior: 'continue',
      onSuccess: [],
      onFailure: [],
    },
  ],
  narrativeTemplates: {
    initiation: 'The brotherhood near {location} tests applicants in the field. What the wild permits to be found.',
    success: 'The brotherhood accepts {name}. A new scout on a new trail.',
    failure: 'Not yet. The wild did not permit it today. Return when the sign is clearer.',
  },
  aftermathConfig: {
    reactions: [
      { kind: 'faction_reputation_gain', factionDefId: 'rangers_brotherhood', delta: 0.05 },
      { kind: 'recent_event', tag: 'rb_join' },
    ],
  },
};

export const RB_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'rb.promotion',
  name: 'Ranger Advancement',
  locationSubtypes: ['town', 'camp', 'fort'],
  rarityTier: 2,
  crudType: 'encounter',
  scale: 'individual',
  reachPrimary: 'iron',
  reachSecondary: 'eye',
  encounterType: 'duel',
  apCost: 1,
  actorAffinities: ['individual'],
  questPriority: 7.0,
  steps: [
    {
      id: 'rb.promotion.1',
      name: 'The Endurance Trial',
      narrativeTemplate: '{?has_faction}Alone in the country the wild does not easily permit. {name} goes where the sign is hard and the bearing harder — what the brotherhood calls the endurance trial.{/has_faction}{?!has_faction}Alone. Hostile country. The trial that higher rank requires.{/?!has_faction}',
      successAfterimage: '{name} returns hardened. The trail was long. The sign is read correctly now.',
      failureAfterimage: 'The trial ends early. The trail broke {name} before {name} broke it.',
      reach: 'iron',
      difficulty: RB_PROMOTION_DIFFICULTY / 100,
      duration: { min: 2, max: 2 },
      failBehavior: 'continue',
      onSuccess: [],
      onFailure: [],
    },
  ],
  narrativeTemplates: {
    initiation: 'Higher rank in the brotherhood requires proving what the wild permits you to survive alone.',
    success: 'The rank is earned. The trail proved what the sign suggested.',
    failure: 'Not yet. Return when the trail has taught what it is still teaching.',
  },
  aftermathConfig: {
    reactions: [
      { kind: 'faction_reputation_gain', factionDefId: 'rangers_brotherhood', delta: 0.05 },
      { kind: 'recent_event', tag: 'rb_promotion' },
    ],
  },
};

export const RB_LIFECYCLE_TEMPLATES: readonly UnifiedActionTemplate[] = [
  RB_JOIN_TEMPLATE,
  RB_PROMOTION_TEMPLATE,
];

// ─── Combined Export ───────────────────────────────────────────────────────

export const ALL_RB_TEMPLATES: UnifiedActionTemplate[] = [
  ...RANGERS_BROTHERHOOD_ENCOUNTER_TEMPLATES,
  ...RANGERS_BROTHERHOOD_SENIOR_TEMPLATES,
  ...RANGERS_BROTHERHOOD_ELITE_TEMPLATES,
  ...RANGERS_BROTHERHOOD_SOCIAL_TEMPLATES,
  RB_JOIN_TEMPLATE,
  RB_PROMOTION_TEMPLATE,
];

// ─── Lookup ───────────────────────────────────────────────────────────────

export function getRangersBrotherhoodEncounterById(id: string): UnifiedActionTemplate | undefined {
  return ALL_RB_TEMPLATES.find(t => t.id === id);
}
