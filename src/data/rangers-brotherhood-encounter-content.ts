/**
 * Rangers Brotherhood Encounter Content — UnifiedActionTemplate format (THR-97).
 *
 * Voice bible: terse, observant, the prose reads as if written by someone on watch.
 * Sentence fragments when moving. Fuller sentences when still. Present tense for
 * the observing beat. "sign", "trail", "track", "bearing", "what the wild permits"
 * carry the voice. Terrain is a character — name it specifically.
 *
 * Systemic affinities:
 *   • intelligence — terrain maps, patrol routes, creature movements, safe passage
 *   • encounter seeds — the threat that slipped away, the rescue that forged a debt
 *   • hidden marks — oathmarks (Brotherhood recognition), land-sworn debts, tracker's-eye
 *   • {location} — heavy. Rangers are place-specific. Every scene is somewhere.
 *   • {?has_ally} — solo patrol vs. paired patrol flavor
 *   • {?has_artifact} — utilitarian gear: bows, maps, tracking horns, weathered rope
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';
import { withEncounterContract } from './encounter-contract-builder';
import {
  FACTION_PROSE_SEED_DELAY_QUEST_TICKS,
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

  withEncounterContract({
    id: 'rb.quest.trail_patrol',
    name: 'Trail Patrol',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'camp', 'fort'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: RB_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The trail out of {location} holds sign if you know how to read it — crushed grass at the ' +
          'wrong angle, a boot print that pressed too deep on the heel. {name} walk{s} the line ' +
          'at half-speed, letting eyes do what legs cannot. ' +
          '{?has_ally}{ally:strongest} takes the left shoulder. Two rangers read twice as much country, ' +
          'and {name} has learned to trust the hand signal over {their} own eyes when {ally:strongest} ' +
          'stops.{/has_ally}' +
          '{?no_ally}Alone on the line. What the wild permits a single pair of eyes to find.{/no_ally}',
        successAfterimage:
          'Movement off-trail, northeast. Recent. Whatever made those tracks had weight and purpose.',
        failureAfterimage:
          'The trail gave nothing up. Either the country is quiet or {name} walked too fast.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (RB_DIFFICULTY_BASE + RB_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { condition: 0.50, possession: 0.50 },
          },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The sign led to a camp — three men, one fire, no posted watch. Amateur work or deliberate ' +
          'provocation; at this distance it does not matter which. {name} read{s} the bearing. ' +
          '{?has_faction}The Brotherhood\'s standing order is clear: one warning, one chance to move ' +
          'on. {name} give{s} it, voice flat, hand on the bow. The order exists because it works.{/has_faction}' +
          '{?no_faction}No protocol to lean on. {name} make{s} the call from the ground, which is ' +
          'where all the real calls get made.{/no_faction}',
        successAfterimage:
          'They moved. Fast, east, taking their fire-kit and leaving everything else. The trail is clear.',
        failureAfterimage:
          'One ran north into the deep country. The other two cooperated. The trail is safer, not clean.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} draws the trail-patrol assignment out of {location}. A length of trail, a half-day out ' +
        'and back. Read what the wild permits, handle what it does not.',
      success:
        'The patrol closes clean. Two men moved on, one trail secured, no casualties. The Brotherhood ' +
        'will hear about the camp.',
      failure:
        'One got away into the deep country. The patrol is logged as incomplete. A follow-up is ' +
        'being arranged.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The trail out of {location} has been walked. Whatever was using the country without ' +
          'permission has been warned off or scattered — for now.',
        changes: [
          {
            id: 'patrol_standing',
            kind: 'reputation',
            title: 'Patrol Record',
            detail: 'A clean trail is a small thing until the caravans start moving. The Brotherhood tallies them.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god read in the patrol line?',
        reactions: [
          {
            id: 'patrol_seed_regroup',
            label: 'The one who fled east will come back with more.',
            intent:
              'A man who runs into the deep country either keeps going or finds allies. ' +
              'The Brotherhood should expect a second visit before the season ends.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'rb.quest.clear_threat',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 2,
                seedLabel: 'Patrol fugitive may return to {location} with reinforcements',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'patrol_tally',
            label: 'Trail is clear. File the report.',
            intent: 'A patrol completed, a trail secured. The Brotherhood runs on these.',
            effects: [
              { kind: 'reputation_tally', key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'rb.quest.track_beast',
    name: 'Track a Beast',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['town', 'camp', 'fort'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: RB_DIFFICULTY_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'Livestock gone near {location}. A goat, maybe two — the farmer is not sure of the count, ' +
          'which means the animal has been working this valley for a while without being named. ' +
          '{name} goes to where the trail starts. Cold print in soft ground. The drag mark. ' +
          'The bearing it took into the hills. ' +
          '{?has_artifact}The leather tracking kit is on {their} hip: cord for measuring stride, ' +
          'chalk for marking trees. Old tools. They work.{/has_artifact}' +
          '{?no_artifact}{name} read{s} the sign with nothing but eyes and time.{/no_artifact}',
        successAfterimage:
          'Three hours old, heading north into the switchback country. The beast is sleeping in ' +
          'a den somewhere up there — the prints say it came down for the goats, not because ' +
          'it was hungry.',
        failureAfterimage:
          'Rain hit before {name} reached the upper pasture. The sign is washed. The trail is cold.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (RB_DIFFICULTY_BASE + RB_DIFFICULTY_STEP + 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.40 },
          },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The den is a collapsed root-shelf under a cedar stand — old, weathered, used every season. ' +
          'The beast is large. Larger than the print suggested, which the print always is until ' +
          'you are standing here. {name} read{s} the entry angle and take{s} the draw line. ' +
          '{?has_faction}The Brotherhood trains for this: patience before the draw, commitment ' +
          'after it. {name} wait{s} for the beast to clear the shadow.{/has_faction}' +
          '{?no_faction}One shot, one chance. The beast has been living by the same arithmetic.{/no_faction}',
        successAfterimage:
          'Clean. The beast fell in the den entrance, which means {name} will need to drag it clear ' +
          'before the smell brings something worse.',
        failureAfterimage:
          'The shot connected but did not hold. The beast is gone into the switchback country, faster ' +
          'than a wounded animal should be able to move. It knows the terrain better than {name} does.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'Something is taking livestock from {location}. The Brotherhood sends {name} to find the ' +
        'sign, follow the trail, and end it.',
      success:
        'The beast is dead. The valley is one degree safer. The livestock count will hold tonight.',
      failure:
        'Wounded and loose in the switchback country. The beast will be more cautious now, which ' +
        'makes it more dangerous. The Brotherhood will need to send someone back.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The hunt at {location} is resolved — cleanly or not. The valley will know the outcome ' +
          'by the count at the next feeding.',
        changes: [
          {
            id: 'hunt_standing',
            kind: 'reputation',
            title: 'Hunt Record',
            detail: 'A dead beast is a closed matter. A wounded one is a future problem. The Brotherhood tallies both.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god read in the hunt?',
        reactions: [
          {
            id: 'hunt_intel_territory',
            label: 'The den has been used every season. Map its territory.',
            intent:
              'A beast that returns annually to the same range is a predictable threat — and a predictable ' +
              'resource. The Brotherhood should know this territory.',
            effects: [
              {
                kind: 'intelligence',
                category: 'military_position',
                label: 'Predator territory mapped near {location}',
                detail:
                  'Den under cedar stand in the northern switchback country. Beast uses the valley ' +
                  'annually, not continuously — seasonal threat, predictable approach vector.',
                reliability: 0.8,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hunt_seed_return',
            label: 'The wounded beast will come back tonight. Hungry and angry.',
            intent:
              'A wounded predator that knows the valley layout will return at night when the advantage ' +
              'shifts. The Brotherhood should post a watch.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'rb.quest.track_beast',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS,
                seedLabel: 'Wounded beast may return to {location} under cover of dark',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hunt_tally',
            label: 'Hunt is done. File the report.',
            intent: 'The livestock are safer. A clean report for the Brotherhood captain.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'rb.quest.survey_border',
    name: 'Border Survey',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['camp', 'fort'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 3, max: 3 },
        difficulty: (RB_DIFFICULTY_BASE + 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The borderland near {location} holds more than the maps admit. {name} walk{s} it ' +
          'ridge by ridge, noting the ravines the cavalry cannot cross, the creek-fords that hold ' +
          'through autumn, the false-flat that looks like open ground and is not. The notebook ' +
          'fills up faster than expected. ' +
          '{?has_faction}The Brotherhood\'s standing survey format calls for three reference points ' +
          'per section, compass bearings to each, a pace count on the approaches. ' +
          '{name} know{s} the format well enough to improve on it.{/has_faction}' +
          '{?no_faction}No standard format to follow. {name} make{s} {their} own notes, trusting ' +
          'that what the captains want will emerge from what the country actually is.{/no_faction}',
        successAfterimage:
          'Twelve sections mapped in three days. The northern approach has a blind gully ' +
          'that does not appear on any Brotherhood chart — an ambush site or an escape route, ' +
          'depending on who gets there first.',
        failureAfterimage:
          'Dense undergrowth on the eastern slope cut the survey short. Four sections incomplete. ' +
          'The maps have a gap where the Brotherhood needed certainty.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (RB_DIFFICULTY_BASE + RB_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.60 },
          },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{name} sit{s} with the notebook in the duty-room at {location}, transferring field notes ' +
          'to a clean copy the captains can read. The work is slower than the survey — translation ' +
          'always is. What made sense on a hillside at dusk has to be made to make sense on paper ' +
          'in lamplight. ' +
          '{?has_faction}The Brotherhood\'s map room is two walls of stitched vellum, updated ' +
          'whenever someone brings better data. {name}\'s survey will add six sections to the north ' +
          'face — and the blind gully goes in with a note the captains should read before they ' +
          'plan the next patrol line.{/has_faction}',
        successAfterimage:
          'The captain reviews the survey without looking up. Then {they} look{s} up. ' +
          '"The gully. You are sure of the bearing?" {name} is sure.',
        failureAfterimage:
          'The report is readable but thin on the eastern sections. The captain marks three points ' +
          'requiring a second pass. The survey is useful, not complete.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The captains at {location} need current maps of the borderland. {name} is sent to walk ' +
        'it and come back with what the country actually looks like.',
      success:
        'Good maps. The blind gully is in the record now. The captains will adjust the patrol line ' +
        'before the week is out.',
      failure:
        'Useful but incomplete. The eastern slope remains a gap. A second survey is forming on the ' +
        'duty board.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The borderland survey near {location} is closed. What {name} found — the good ground ' +
          'and the gap — will shape the Brotherhood\'s patrol lines this season.',
        changes: [
          {
            id: 'survey_record',
            kind: 'reputation',
            title: 'Survey Record',
            detail: 'A thorough survey improves every patrol that follows it. A thin one is worse than none.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the mapped borderland?',
        reactions: [
          {
            id: 'survey_intel_routes',
            label: 'The blind gully changes everything about the approach.',
            intent:
              'A gully that does not appear on existing charts is an intelligence advantage — for ' +
              'the Brotherhood if they secure it, for any enemy who finds it first.',
            effects: [
              {
                kind: 'intelligence',
                category: 'military_position',
                label: 'Unmapped gully on northern approach to {location}',
                detail:
                  'Blind ravine on northern face, hidden by false-flat terrain. Does not appear on ' +
                  'existing Brotherhood charts. Viable ambush site or concealed approach — whoever ' +
                  'knows it first has the advantage.',
                reliability: 0.9,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'survey_tally',
            label: 'Maps updated. The borderland is known.',
            intent: 'A clean survey, properly filed. The Brotherhood patrol lines will be better for it.',
            effects: [
              { kind: 'reputation_tally', key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'rb.quest.clear_threat',
    name: 'Clear the Threat',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['town', 'camp', 'fort'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: RB_DIFFICULTY_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'A camp spotted on the ridge above {location}. Three fires last night, which means eight ' +
          'men or twelve — campfire discipline separates the professionals from the amateurs. ' +
          '{name} goes up before first light to count and read the sign. ' +
          '{?has_faction}The Brotherhood\'s protocol for threat assessment: two hours of observation ' +
          'before any approach. {name} set{s} up in a draw line the wind favors and wait{s}.{/has_faction}' +
          '{?no_faction}No protocol, just patience. What the dawn shows is what {name} will work with.{/no_faction}',
        successAfterimage:
          'Nine men. Two sentries with a three-minute rotation gap. Rested, but not organized — ' +
          'the sentry patterns overlap. Someone is in charge, but not well.',
        failureAfterimage:
          'Alert sentries, no rotation gaps. The camp has been observed before. Approaching without ' +
          'a plan will get people killed.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (RB_DIFFICULTY_BASE + RB_DIFFICULTY_STEP + 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.50 },
          },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The three-minute gap in the sentry rotation is everything. {name} move{s} into the camp ' +
          'during it, bow up, moving at the speed the terrain permits, which is not fast. ' +
          '{?has_ally}{ally:strongest} takes the left approach. One hand signal, two angles of ' +
          'fire — the camp has no answer to that geometry.{/has_ally}' +
          '{?no_ally}Alone in the camp. Nine men and a three-minute window and a single ranger ' +
          'who has counted the odds and decided they are acceptable.{/no_ally}',
        successAfterimage:
          'Seven detained. Two fled north. The camp is cleared, the fires put out, the goods ' +
          'left behind will go to {location} for the Brotherhood to assess.',
        failureAfterimage:
          'They were better fighters than the camp suggested. {name} withdrew with two wounded and ' +
          'a clear view of four men heading southeast. The camp is not clear.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A hostile camp has appeared above {location}. The Brotherhood sends {name} to assess ' +
        'the numbers and clear the threat.',
      success:
        'Camp cleared. Seven detained, two fled. The Brotherhood will send someone after the two ' +
        'who went north.',
      failure:
        'The clearance failed. The camp knows the Brotherhood is watching now, which makes the ' +
        'follow-up harder.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The camp above {location} has been engaged. The threat is reduced or scattered — but ' +
          'the two who fled are a loose thread the Brotherhood will need to pull.',
        changes: [
          {
            id: 'threat_cleared',
            kind: 'reputation',
            title: 'Threat Response',
            detail: 'A cleared camp makes {location} safer. A scattered one makes it more complicated.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note about the camp and the men who left it?',
        reactions: [
          {
            id: 'threat_seed_regroup',
            label: 'The two who fled will bring the story back to whoever sent them.',
            intent:
              'Men who retreat do not disappear. They report. Whoever dispatched the camp will know ' +
              'the Brotherhood is present and will adjust.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'rb.senior.ambush_raiders',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 2,
                seedLabel: 'Escaped operatives may return to {location} with a larger force',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'threat_tally',
            label: 'Camp cleared. File the report and the goods assessment.',
            intent: 'A threat neutralized, seven detained, the Brotherhood\'s patrol line secured.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'rb.quest.wilderness_rescue',
    name: 'Wilderness Rescue',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'camp'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: (RB_DIFFICULTY_BASE + 5) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'Travelers missing from {location} since yesterday morning. The last known bearing: east ' +
          'on the old mill road, no destination stated, which is how people disappear. {name} ' +
          'takes the bearing and reads the road: broken grass, a dropped bundle, a heel-print that ' +
          'deepened where the person stumbled. Someone who did not know where they were going ' +
          'and then realized it too late. ' +
          '{?has_faction}The Brotherhood keeps a missing-persons cache on the duty board — {name} ' +
          'checked it before leaving. The description matches two adults, one child. The child ' +
          'changes the urgency.{/has_faction}' +
          '{?no_faction}No file on who is missing, just a panicked neighbor and a cold trail. ' +
          '{name} work{s} with what the ground gives.{/no_faction}',
        successAfterimage:
          'Off-trail, following a creek that runs the wrong direction. Two hours ahead, maybe three. ' +
          'The prints are fresher lower — they came down into the valley looking for water.',
        failureAfterimage:
          'Too much country, too little time. The trail branches four ways at the old mill ruins and ' +
          '{name} cannot read which one the missing took.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (RB_DIFFICULTY_BASE + RB_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.05,
          rewardPool: {
            categoryWeights: { condition: 0.60, possession: 0.40 },
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'They are where the trail said they would be — a family of three, huddled under a ' +
          'limestone ledge near the creek bend, cold but not hurt. The child has been crying. ' +
          'The parents are too tired to be relieved yet. {name} give{s} them water first and ' +
          'leaves the questions for later. ' +
          '{?has_ally}{ally:strongest} takes the child. Two adults can move faster, and the ' +
          'parents keep up better when they are not carrying.{/has_ally}' +
          '{?no_ally}Three civilians and one ranger and a two-hour walk back to {location}. ' +
          '{name} set{s} the pace to what the slowest can manage.{/no_ally}',
        successAfterimage:
          'All three back at {location} before dark. The mother grabs {name}\'s arm and says ' +
          'something. {name} does not catch the words. The sentiment is clear enough.',
        failureAfterimage:
          'The father collapsed at the creek crossing — exhaustion, not injury, but he cannot walk. ' +
          '{name} will need to go back to {location} for a stretcher. The night is coming in.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'Travelers are missing in the country around {location}. The Brotherhood sends {name} to ' +
        'find the trail and bring them back.',
      success:
        'Found. All three. Back before dark. {name} does not mention how close it was.',
      failure:
        'Found but not home yet. The father is down at the creek crossing and the night is coming. ' +
        'A second Brotherhood team is on the way.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The rescue out of {location} is resolved. The family is back or still in the field — ' +
          'either way, the Brotherhood has a record of what the country near the old mill road ' +
          'will do to someone who does not know it.',
        changes: [
          {
            id: 'rescue_standing',
            kind: 'reputation',
            title: 'Rescue Record',
            detail: 'The Brotherhood earns its place in the settlement by doing this work without ceremony.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god take from the rescue?',
        reactions: [
          {
            id: 'rescue_mark_debt',
            label: 'The family owes a debt. That is not nothing in a frontier settlement.',
            intent:
              'A family saved is a family with a memory of it. Their gratitude will translate to ' +
              'something tangible when the Brotherhood next needs it — shelter, information, a ' +
              'witness who speaks clearly.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'debt',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label: 'Family at {location} owes the Brotherhood a significant debt of gratitude',
                revealFamilies: ['rb.social', 'rb.quest'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'rescue_tally',
            label: 'Rescue complete. The Brotherhood logs it and moves on.',
            intent: 'Three lives back at {location}. The kind of work the Brotherhood was built for.',
            effects: [
              { kind: 'reputation_tally', key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Senior Quest Templates ───────────────────────────────────────────────

export const RANGERS_BROTHERHOOD_SENIOR_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'rb.senior.deep_scout',
    name: 'Deep Scout Mission',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'regional',
    locationSubtypes: ['camp', 'fort'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 3, max: 3 },
        difficulty: RB_SENIOR_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'Past the last Brotherhood waymark out of {location}, the country stops being the ' +
          'kind the maps describe. {name} moves at night where the terrain permits, by day where ' +
          'it does not. There are settlements here that do not appear on any chart — small, ' +
          'defensible, old. The people in them watch with a particular kind of stillness. ' +
          '{?has_ally}Two sets of eyes. {ally:strongest} takes the low ground while {name} ' +
          'takes the ridges. In unknown country, what one misses the other finds.{/has_ally}' +
          '{?no_ally}Alone in the deep country. The Brotherhood sends rangers who can read the ' +
          'land before they read the people on it.{/no_ally}',
        successAfterimage:
          'Three days in. Two settlements, one hidden ford, a patrol route that predates the ' +
          'Brotherhood by a generation. Whoever walks this country has been doing it longer ' +
          'than the Brotherhood has been paying attention.',
        failureAfterimage:
          'Spotted on the second day by a shepherd whose dog had better ears than {name}\'s ' +
          'cover. The mission is blown. The deep country knows {name} was here.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (RB_SENIOR_BASE + RB_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.06,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The extraction is the hardest part. Coming in, {name} could take time. Going out, ' +
          'there is a patrol route behind {them} and a ford that may or may not be watched. ' +
          '{name} move{s} in the rain, which is the best weather for the deep country. ' +
          '{?has_faction}The Brotherhood extraction protocols exist because someone died ' +
          'establishing them. {name} follow{s} them without modification.{/has_faction}' +
          '{?no_faction}No support on the other side of the ford. {name} make{s} the crossing ' +
          'alone and notes everything the rain tells {them} about the current.{/no_faction}',
        successAfterimage:
          'Back across the ford before the patrol passed it. The notebook is soaked. The ' +
          'ink held. {name} wrings {their} hat out and keeps moving.',
        failureAfterimage:
          'Challenged at the ford — a patrol that was not there on the way in. {name} talked ' +
          '{their} way through but the patrol noted {their} direction. The data is in, but the ' +
          'Brotherhood\'s next scout will have a harder time.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The Brotherhood at {location} needs to know what is in the deep country beyond the ' +
        'waymarks. {name} goes to find out.',
      success:
        'Clean extraction. Good intelligence. The captains will spend a week with the notebook.',
      failure:
        'The extraction was messy. The data is in, but the deep country knows it was observed. ' +
        'The next scout will work against a higher alert.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The deep scout out of {location} is complete. What {name} brought back from beyond ' +
          'the waymarks will update the Brotherhood\'s picture of the frontier for a season.',
        changes: [
          {
            id: 'deep_scout_intel',
            kind: 'reputation',
            title: 'Deep Country Intelligence',
            detail: 'Information from beyond the waymarks is rare. The Brotherhood will act on it while it is fresh.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god hold onto from the deep country?',
        reactions: [
          {
            id: 'deep_scout_intel_frontier',
            label: 'Map the hidden ford and the patrol route that uses it.',
            intent:
              'A ford that predates the Brotherhood charts and a patrol route through it — whoever ' +
              'controls that crossing controls the deep country access. This is load-bearing intelligence.',
            effects: [
              {
                kind: 'intelligence',
                category: 'military_position',
                label: 'Hidden ford and pre-Brotherhood patrol route beyond {location}',
                detail:
                  'Concealed river crossing and an established patrol circuit not on any Brotherhood ' +
                  'chart. Local settlements use it regularly. Strategic chokepoint for frontier access.',
                reliability: 0.85,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'deep_scout_mark',
            label: 'What {name} saw in the deep country is not for general circulation.',
            intent:
              'Some intelligence is load-bearing precisely because it is not widely known. ' +
              'The captains will see it; the duty board will not.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY + 0.1,
                label: '{name} holds restricted frontier intelligence from the deep country near {location}',
                revealFamilies: ['rb.senior', 'rb.elite'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'deep_scout_tally',
            label: 'Intelligence filed. The Brotherhood updates its maps.',
            intent: 'A clean deep scout, properly documented. The frontier picture is sharper.',
            effects: [
              { kind: 'reputation_tally', key: 'eye.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'rb.senior.ambush_raiders',
    name: 'Ambush the Raiders',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'regional',
    locationSubtypes: ['camp', 'fort'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: RB_SENIOR_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'Raiders working the roads out of {location} for the third week running. The pattern ' +
          'is not random — they know which caravans are worth stopping and which are not, which ' +
          'means they have someone on the inside or a very good eye on the traffic. {name} ' +
          'walk{s} their route backwards, reading where they rest, where they observe, where they ' +
          'have not yet thought to look. ' +
          '{?has_faction}The Brotherhood runs ambushes by selecting the ground first and the ' +
          'timing second. {name} look{s} for the ridge, the draw, the place the wild permits a ' +
          'wait.{/has_faction}' +
          '{?no_faction}No Brotherhood team. Just {name} and the terrain and a pattern to ' +
          'exploit before the raiders change it.{/no_faction}',
        successAfterimage:
          'The ridge above the third ford. The raiders pass it every third morning — early, ' +
          'before the light gets ahead of them. The approach favors the high ground.',
        failureAfterimage:
          'The raiders changed their pattern. The trail doubles back twice on the second day. ' +
          'Someone told them to be cautious.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (RB_SENIOR_BASE + RB_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.06,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.40 },
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The third morning. Pre-dawn. The ridge above the ford. {name} has been here since ' +
          'midnight, which is the cost of having the high ground when you need it. ' +
          'The raiders come through at first grey light, five of them, in the order the ' +
          'pattern predicted. ' +
          '{?has_ally}{ally:strongest} is forty paces right. One signal, two arcs of fire, ' +
          'no angle for the raiders to use. They built this approach together over two nights ' +
          'of map-work. It shows.{/has_ally}' +
          '{?no_ally}One ranger. Five raiders. The ridge and the dark and the particular ' +
          'arithmetic of surprise against numbers.{/no_ally}',
        successAfterimage:
          'Four down, one ran back along the road the way they came — which is useful, because ' +
          'that direction will tell {name} something about where they winter.',
        failureAfterimage:
          'The ambush held the first exchange and then the raiders broke into three directions. ' +
          'Two escaped into the rough country, which means two raiders who know the Brotherhood ' +
          'runs these roads now.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'Raiders have been working the roads out of {location} for three weeks. The Brotherhood ' +
        'sends {name} to read their pattern and break it.',
      success:
        'Four down, one fled. The road is clear. The direction the survivor ran tells the ' +
        'Brotherhood something useful.',
      failure:
        'The ambush engaged but did not close. Two raiders loose in the rough country, and ' +
        'they know the Brotherhood\'s approach now.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The raider ambush near {location} is done. The road is quieter — for now. The one ' +
          'who ran will carry the story back to whoever is directing the raids.',
        changes: [
          {
            id: 'ambush_standing',
            kind: 'reputation',
            title: 'Ambush Record',
            detail: 'A broken raider pattern is worth more than the count of those taken.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god read in the aftermath of the ambush?',
        reactions: [
          {
            id: 'ambush_intel_winter',
            label: 'The direction the survivor fled points at their winter camp.',
            intent:
              'A raider who runs home when pressed leads back to the source. The Brotherhood ' +
              'can follow the bearing and find whoever has been organizing the road work.',
            effects: [
              {
                kind: 'intelligence',
                category: 'military_position',
                label: 'Raider winter camp bearing from {location} ford ambush',
                detail:
                  'Survivor fled northwest along the secondary road, not toward the settlement. ' +
                  'Suggests a base camp in the rough country northwest of {location} — not a ' +
                  'temporary position.',
                reliability: 0.7,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ambush_seed_regroup',
            label: 'The survivors will regroup and bring more.',
            intent:
              'Two loose raiders with a story about a Brotherhood ambush will find allies. ' +
              'The pattern will resume, larger and more careful.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'rb.elite.frontier_defense',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 3,
                seedLabel: 'Escaped raiders near {location} may return with an organized force',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ambush_tally',
            label: 'Road secured. File the count and the bearing.',
            intent: 'Four raiders off the road, one fled. The Brotherhood\'s approach is on record.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'rb.senior.map_unknown',
    name: 'Map the Unknown',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'regional',
    locationSubtypes: ['camp', 'fort'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 3, max: 3 },
        difficulty: RB_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The Brotherhood\'s maps of the country east of {location} end at a line someone drew ' +
          'thirty years ago and labeled "uncharted." {name} is sent to make the label false. ' +
          'Three weeks of walking, two of them wet, one of them lost until the landmark ' +
          'matched the sketch — and then not lost, just in country that had never been described ' +
          'and therefore looked wrong until it didn\'t. ' +
          '{?has_faction}The Brotherhood\'s expedition kit: one hundred paces of rope, a compass ' +
          'that has survived three previous rangers, a blank ledger for the survey notes. ' +
          '{name} uses all of it.{/has_faction}' +
          '{?no_faction}The ledger is {their} own. The notes are in {their} own hand. If {name} ' +
          'does not come back, the country stays uncharted.{/no_faction}',
        successAfterimage:
          'A river that does not appear anywhere. A valley between two ridges that the old ' +
          'compass bearing never pointed at. Three weeks of country that the Brotherhood has ' +
          'never walked, now walked.',
        failureAfterimage:
          'Impassable terrain on the eastern face — not technically, but practically. Three days ' +
          'of dead ends and backtrack have consumed the survey time. The blank space stays blank.',
      },
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: (RB_SENIOR_BASE + RB_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.06,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.50 },
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          '{name} sit{s} in the duty-room at {location} for two days after returning, ' +
          'transcribing the expedition ledger into a map the captains can read without ' +
          'knowing {their} personal notation system. The river gets a name. The valley ' +
          'gets a name. The dead ends get marked as such. ' +
          '{?has_faction}The Brotherhood\'s cartographer looks at the emerging map for a long ' +
          'time. "{name}," {they} say{s} finally. "This valley. Is it defensible?" ' +
          '{name} think{s} about the sightlines and the single approach and says yes.{/has_faction}' +
          '{?no_faction}{name} note{s} the question the map raises before the captains can ask it: ' +
          'the valley has one entrance. Two rangers with good sight lines hold that valley against ' +
          'an army for a morning.{/no_faction}',
        successAfterimage:
          'The map is filed, the river named, the valley\'s strategic value noted in the margin ' +
          'in the captain\'s own hand. The blank space is no longer blank.',
        failureAfterimage:
          'The transcription is useful, not complete. The eastern sections are sketched from memory ' +
          'after the field notes got wet. The captains accept it with the caveat that it needs ' +
          'a second pass.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The Brotherhood\'s maps of the country east of {location} end at a line from thirty years ' +
        'ago. {name} is sent to find out what is on the other side of it.',
      success:
        'A river, a valley, and three weeks of country that the Brotherhood can now name. The ' +
        'blank space is closed.',
      failure:
        'Partial coverage. The eastern face remains a gap, and the valley\'s approaches are only ' +
        'roughly sketched. A second expedition is already on the duty board.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The mapping expedition beyond {location} has returned what it could. New country is ' +
          'on the Brotherhood\'s charts — a defensible valley, an unnamed river, three weeks of ' +
          'terrain that no one in the Brotherhood had walked before.',
        changes: [
          {
            id: 'mapping_intel',
            kind: 'reputation',
            title: 'Frontier Cartography',
            detail: 'A map that extends what was known before is worth more than a patrol that confirms what was already known.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god take from the blank space that is now known?',
        reactions: [
          {
            id: 'mapping_intel_valley',
            label: 'The defensible valley is strategic. The Brotherhood should secure it.',
            intent:
              'A valley with a single approach and good sightlines is a Brotherhood asset ' +
              'waiting to be used — for resupply, for retreat, for a forward post the ' +
              'enemy does not know exists.',
            effects: [
              {
                kind: 'intelligence',
                category: 'military_position',
                label: 'Defensible valley with single approach east of {location}',
                detail:
                  'Previously unmapped valley — one entrance, elevated sightlines, water source. ' +
                  'Viable forward base or emergency refuge position for Brotherhood operations.',
                reliability: 0.9,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mapping_seed_settlers',
            label: 'The valley will attract settlers when word spreads.',
            intent:
              'Good land that is newly mapped does not stay empty. The Brotherhood should use ' +
              'it before someone else does.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'rb.quest.wilderness_rescue',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 4,
                seedLabel: 'The newly mapped valley east of {location} will draw settlers',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'mapping_tally',
            label: 'Map filed. The blank space is the Brotherhood\'s now.',
            intent: 'Three weeks of country, charted and filed. The frontier picture is larger.',
            effects: [
              { kind: 'reputation_tally', key: 'eye.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Elite Quest Templates ────────────────────────────────────────────────

export const RANGERS_BROTHERHOOD_ELITE_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'rb.elite.monster_hunt',
    name: 'The Great Hunt',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    reach: 'eye',
    crudType: 'delete',
    scale: 'regional',
    locationSubtypes: ['camp', 'fort'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 3, max: 3 },
        difficulty: RB_ELITE_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'Something old is working the frontier around {location} — not opportunistic, ' +
          'not territorial in the ordinary sense, but purposeful in the way that ancient predators ' +
          'are purposeful. Three settlements have reported sign in the last month. The print is ' +
          'larger than {name} expected. {name} follow{s} the trail for five days before it stops ' +
          'doubling back. Before that: it was reading {name}. After: it stopped needing to. ' +
          '{?has_faction}The Brotherhood has a dossier on this kind of hunt. It ends one of two ' +
          'ways: the ranger learns the beast faster than the beast learns the ranger, or it does not.{/has_faction}' +
          '{?no_faction}No prior reports, no dossier, no precedent. Just the tracks and the thing ' +
          'that made them, somewhere in the switchback country ahead.{/no_faction}',
        successAfterimage:
          'The lair. A collapsed tor on the north face of the ridge, deep enough that daylight ' +
          'does not reach the back wall. The sign says it has been here for years. Decades, maybe.',
        failureAfterimage:
          'The trail doubles on itself and vanishes at a rocky outcrop. The beast has ' +
          'been in this country long enough to know where its tracks go invisible. It is watching ' +
          '{name} work and deciding whether to be found.',
      },
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: (RB_ELITE_BASE + RB_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.03 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'Outside the tor, at distance. {name} watch{es} the entrance for two days, reading the ' +
          'pattern: it leaves at dusk, southeast, comes back before the third hour of dark. ' +
          'It avoids the open ground west of the tor, which means west is where the draw line is. ' +
          '{?has_artifact}The elder-wood bow the Brotherhood issues for great hunts is heavier ' +
          'than {name}\'s training bow by three pounds. {name} has been shooting it every morning ' +
          'for a week. The difference in draw is still there. The accuracy is not.{/has_artifact}' +
          '{?no_artifact}{name} work{s} with what {they} carry{s}: standard Brotherhood issue, ' +
          'well-maintained, accurate to sixty paces. The question is whether sixty paces is enough.{/no_artifact}',
        successAfterimage:
          'It moves on a bias against the wind, which is a learned behavior, not an instinct. ' +
          'This is an animal that has been hunted before and studied what did not kill it. The ' +
          'draw line needs to account for that.',
        failureAfterimage:
          'It changes its routine on the second day. Either it knows it\'s being watched or ' +
          'it knows by the absence of its usual prey that something is wrong near the tor. ' +
          'The pattern is gone. {name} has to improvise.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (RB_ELITE_BASE + RB_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.30, possession: 0.40, bestowed_power: 0.30 },
          },
        },
        failureMetadata: { reputationDelta: -0.03 },
        narrativeTemplate:
          'Dusk. The west draw. The thing that has been using the frontier around {location} for ' +
          'decades comes out of the tor on its evening line, and for the first time in the hunt, ' +
          'it does not have the information advantage. {name} ha{s} been in the draw line since ' +
          'noon. Still as the stone the draw is cut from. ' +
          '{?has_faction}The Brotherhood trains this: the kill shot is the second shot, not the ' +
          'first. The first tells the beast where you are. The second tells it where to fall.{/has_faction}' +
          '{?no_faction}One chance in the draw. Whatever {name} has learned about this animal ' +
          'in five days of trailing it comes down to this geometry.{/no_faction}',
        successAfterimage:
          'It fell in the draw, seventy paces from the tor entrance. {name} does not approach ' +
          'immediately. Old hunters do not. It is the kind of dead that takes a moment to confirm.',
        failureAfterimage:
          'The first shot connected but the beast did not fall — it turned and came out of the ' +
          'draw at speed, and {name} moved without thinking, and is alive because of it. The ' +
          'beast is somewhere east, wounded, and it now knows exactly what {name} smells like.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A legendary predator has denied the frontier around {location} to the Brotherhood long ' +
        'enough. The captains send {name} — alone, which is how great hunts go — to find it, ' +
        'read it, and end it.',
      success:
        'The beast is dead in the draw. The frontier around {location} is a different place ' +
        'tonight than it was this morning. {name} does not mention the close part.',
      failure:
        'Wounded and loose, and it knows {name}\'s scent. The Brotherhood will need to send ' +
        'someone else — the beast has adapted to {name} specifically now.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The great hunt near {location} has resolved. The frontier is either safer or more ' +
          'dangerous, depending on how the last shot landed. Either way, the Brotherhood has ' +
          'a record of this hunt — what the beast was, where it lived, what it knew.',
        changes: [
          {
            id: 'great_hunt_outcome',
            kind: 'reputation',
            title: 'Great Hunt Record',
            detail: 'A legendary kill is told at campfires for a generation. A legendary failure is told longer.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god hold onto from the great hunt?',
        reactions: [
          {
            id: 'great_hunt_mark_land_sworn',
            label: 'Five days in its territory. {name} will never walk the frontier the same way.',
            intent:
              'A ranger who has hunted a legendary predator and survived carries something the ' +
              'briefing room cannot teach. The Brotherhood will notice this in {name}\'s subsequent work.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY + 0.2,
                label: '{name} has hunted a legendary predator near {location} — and learned what it knew',
                revealFamilies: ['rb.elite', 'rb.senior'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'great_hunt_seed_legend',
            label: 'The kill will draw hunters from outside the Brotherhood.',
            intent:
              'A legendary kill is a story that travels. Others will come to verify it, learn from ' +
              'it, or compete with it. The frontier around {location} will be busier.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'rb.quest.trail_patrol',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 3,
                seedLabel: 'News of the kill draws outside hunters to the frontier near {location}',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'great_hunt_tally',
            label: 'The hunt is filed. The frontier is opened.',
            intent: 'A legendary kill, documented. The Brotherhood\'s maps of the frontier have new annotations.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 3 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'rb.elite.frontier_defense',
    name: 'Frontier Defense',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    reach: 'iron',
    crudType: 'update',
    scale: 'regional',
    locationSubtypes: ['fort'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: RB_ELITE_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'A force has been moving on the frontier near {location} for three days. Not raiders — ' +
          'the column discipline is military. Someone has decided the Brotherhood\'s frontier is ' +
          'a boundary they can cross. {name} goes up to count. Three approaches, twelve to fifteen ' +
          'per approach, scout elements two hours ahead of the main body. ' +
          '{?has_faction}The Brotherhood\'s threat assessment protocol: numbers first, routes second, ' +
          'timeline third. {name} works through the checklist in the first hour and sends a ' +
          'runner back with the count before continuing to read the routes.{/has_faction}' +
          '{?no_faction}No runner available. {name} hold{s} the intelligence alone until the ' +
          'assessment is complete. Getting back with half the picture is worse than waiting ' +
          'for the full one.{/no_faction}',
        successAfterimage:
          'Forty-two. Three columns, fifteen-twelve-fifteen. Scouts two hours out — there is time ' +
          'to select ground if the Brotherhood moves in the next four hours.',
        failureAfterimage:
          'The column moves faster than the count predicted. The scout elements are already ' +
          'closer to {location} than expected. The Brotherhood is reacting now, not choosing.',
      },
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: (RB_ELITE_BASE + RB_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.03 },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          '{name} deploy{s} the Brotherhood squads to three positions — the ridge above the ' +
          'primary ford, the switchback that controls the secondary approach, and the high ' +
          'ground north of {location} that the column\'s scouts will reach last. ' +
          'Twelve rangers, three positions, one captain who has to be in four places and manages ' +
          'it by trusting the squad leaders to read the ground themselves. ' +
          '{?has_ally}{ally:strongest} takes the ridge. They have held a ridge line before and ' +
          '{name} knows what that kind of holding looks like — controlled, patient, exactly as ' +
          'loud as necessary.{/has_ally}' +
          '{?no_ally}{name} is the only senior ranger. Every squad leader gets the briefing and ' +
          'the order, then they own their ground. Trust is the only command structure that works ' +
          'at range.{/no_ally}',
        successAfterimage:
          'All three positions set before the scouts reach them. The column is walking into a ' +
          'channeled approach and does not know it yet.',
        failureAfterimage:
          'The eastern squad is late to position — the secondary approach has scouts in it already. ' +
          'The channel is partial. The column will have an angle.',
      },
      {
        reach: 'iron',
        duration: { min: 3, max: 3 },
        difficulty: (RB_ELITE_BASE + RB_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.30, possession: 0.30, bestowed_power: 0.40 },
          },
        },
        failureMetadata: { reputationDelta: -0.03 },
        narrativeTemplate:
          'The column hits the ridgeline and finds the Brotherhood already there, which was ' +
          'the point. The fight is not equal — twelve rangers with the high ground and ' +
          'forty-two men who came up a channeled approach — but it is not brief. ' +
          '{?has_faction}The Brotherhood doctrine for frontier defense: hold until the column ' +
          'breaks into its three approaches, then the ridge takes the center, the secondary ' +
          'closes the escape line, and the north takes the rear. An envelope. {name} call{s} ' +
          'it when the timing is right, which is a judgment that cannot be delegated.{/has_faction}' +
          '{?no_faction}No doctrine to apply — this is larger than any engagement {name} has ' +
          'planned for. Hold the ground and trust the squads.{/no_faction}',
        successAfterimage:
          'The column broke at the secondary. Organized retreat south, abandoning the approach ' +
          'kit and most of the supply column. The Brotherhood holds {location}\'s frontier tonight.',
        failureAfterimage:
          'The northern position was overrun. Tactical withdrawal to the secondary line — ' +
          'the frontier is compressed but not broken. {name} is accounting for the casualties ' +
          'and does not have a complete number yet.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A military force is moving on the frontier near {location}. The Brotherhood sends ' +
        '{name} to read the threat, select the ground, and hold it.',
      success:
        'The column broke and retreated. The frontier holds. Twelve rangers held against forty-two, ' +
        'which will be in the record without emphasis because the Brotherhood does not add emphasis.',
      failure:
        'The frontier compressed to the secondary line. Not broken, but not what it was this morning. ' +
        'The Brotherhood is reassembling and {name} is writing the casualty report.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The frontier engagement near {location} is over. The Brotherhood held or gave ground — ' +
          'either way, the column knows now that the frontier is defended, which changes their ' +
          'calculus for what comes next.',
        changes: [
          {
            id: 'frontier_defense_outcome',
            kind: 'faction_reputation',
            title: 'Frontier Defense',
            detail: 'A defended frontier is a message. A broken one is also a message. The Brotherhood sent one.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the frontier engagement?',
        reactions: [
          {
            id: 'frontier_intel_column',
            label: 'The column\'s discipline tells {name} who sent it.',
            intent:
              'Military column discipline is specific. Whoever trained these men can be identified ' +
              'from the way they moved under fire. The Brotherhood should know who is testing the frontier.',
            effects: [
              {
                kind: 'intelligence',
                category: 'military_position',
                label: 'Organized military force tested the frontier near {location}',
                detail:
                  'Forty-two in three columns with coordinated scout deployment — not raiders, ' +
                  'trained soldiers. Broke at the secondary approach, retreated south. ' +
                  'Someone with resources is evaluating Brotherhood frontier strength.',
                reliability: 0.85,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'frontier_tally',
            label: 'Frontier held. File the engagement report.',
            intent: 'The Brotherhood held the line. The record shows the count and the method.',
            effects: [
              { kind: 'reputation_tally', key: 'iron.positive', delta: 3 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Social Encounter Templates ────────────────────────────────────────────

export const RANGERS_BROTHERHOOD_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [

  withEncounterContract({
    id: 'rb.social.campfire_tales',
    name: 'Campfire Tales',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'camp', 'fort'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: (RB_DIFFICULTY_BASE - 10) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { condition: 0.50, bestowed_power: 0.50 },
          },
        },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The campfire at {location} has been going for an hour and a half, which is when the ' +
          'stories start. Rangers do not talk much during the day — the work does not require it ' +
          'and the habit is hard to break after dark. But at the fire, the day\'s sign gets told. ' +
          'What the trail gave up. What it withheld. {name} ha{s} a story worth the circle. ' +
          '{?has_faction}The Brotherhood listens to these stories the way it listens to intelligence ' +
          'briefings — quietly, remembering details that might matter later. {name}\'s story has ' +
          'a detail worth remembering.{/has_faction}' +
          '{?no_faction}No Brotherhood protocols around the telling. Just the fire and the dark ' +
          'and the particular attention of people who spend their days reading what the land says.{/no_faction}',
        successAfterimage:
          'The story earns the nods. Not applause — rangers do not applaud at campfires — but ' +
          'the particular attention that means the detail was worth hearing. The fire crackles on.',
        failureAfterimage:
          'The story was too long or too familiar or not the right night for it. The circle ' +
          'was polite. Polite is its own kind of quiet.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The campfire at {location} draws the rangers in off the trails. Stories are told. ' +
        '{name} has one.',
      success:
        'A good story. The detail worth hearing was heard. The fire went another hour.',
      failure:
        'Not tonight. The circle was polite. The story needed better ground.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The campfire at {location} is banked. Whatever was said around it — the stories, ' +
          'the intelligence, the detail worth hearing — has been absorbed into the Brotherhood\'s ' +
          'working knowledge.',
        changes: [
          {
            id: 'campfire_standing',
            kind: 'reputation',
            title: 'Campfire Standing',
            detail: 'Rangers remember who tells useful stories. They remember who tells long ones.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god take from the fire\'s circle?',
        reactions: [
          {
            id: 'campfire_seed_recruit',
            label: 'A young warden was listening. {name}\'s story will bring them to the trails.',
            intent:
              'A story that lands well at a Brotherhood campfire has weight beyond the evening. ' +
              'The right story at the right fire puts someone new on the trail.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'rb.join',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS * 3,
                seedLabel: 'A warden at {location} was inspired by the campfire story',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'campfire_tally',
            label: 'Good story. The circle holds.',
            intent: 'The Brotherhood\'s culture is passed around campfires. {name} contributed.',
            effects: [
              { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'rb.social.tracking_lesson',
    name: 'Tracking Lesson',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'eye',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'camp', 'fort'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (RB_DIFFICULTY_BASE - 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { condition: 0.60, bestowed_power: 0.40 },
          },
        },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'A veteran ranger at {location} takes {name} out to a cleared section of the trail where ' +
          'the ground holds sign well. Two sets of prints: one human, one animal, both old. The ' +
          'veteran points at the human print without speaking. {name} crouch{es} and read{s} it. ' +
          '{?has_faction}The Brotherhood teaches reading as conversation: trainer points, trainee ' +
          'names what they see, trainer confirms or corrects. No grades. Just the print and what ' +
          'it says and whether {name} heard it correctly.{/has_faction}' +
          '{?no_faction}No formal teaching structure — just a senior ranger who has been reading ' +
          'sign for fifteen years showing {name} what {they} is still missing.{/no_faction}',
        successAfterimage:
          'The detail {name} had been reading wrong for two seasons: the heel pressure. Not what ' +
          'it indicates about weight — what it indicates about direction of travel. ' +
          'The veteran watches {name} process this and nods once.',
        failureAfterimage:
          'The sign was there. {name} named six things; the seventh was the one that mattered, ' +
          'and {they} did not see it. The trainer pointed at it without comment and the lesson ' +
          'was over.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A veteran ranger at {location} offers a lesson in reading ground sign. {name} takes it.',
      success:
        'One thing learned that {name} had been getting wrong. Not a large thing — a heel pressure ' +
        'reading — but it will change how every trail looks from here.',
      failure:
        'Six out of seven. The seventh is the one the trainer pointed at in silence. ' +
        '{name} will be back at the same trail in the morning, alone, reading it again.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The tracking lesson at {location} is done. What was shown and whether it was absorbed ' +
          'will surface the next time {name} reads a print that matters.',
        changes: [
          {
            id: 'tracking_skill',
            kind: 'growth',
            title: 'Tracking Refinement',
            detail: 'A senior ranger\'s correction is worth three seasons of independent practice.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god take from the lesson and what it corrected?',
        reactions: [
          {
            id: 'tracking_mark_eye',
            label: 'The heel pressure correction changes how {name} reads every trail.',
            intent:
              'A learned correction from a senior tracker becomes part of how {name} sees the ' +
              'ground. The Brotherhood will notice the improvement before {name} can name it.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY - 0.1,
                label: '{name} learned a tracking correction from a Brotherhood veteran at {location}',
                revealFamilies: ['rb.quest', 'rb.senior'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'tracking_tally',
            label: 'Lesson absorbed. The trail will give up more.',
            intent: 'Brotherhood skills compound. Each lesson builds on the last.',
            effects: [
              { kind: 'reputation_tally', key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'rb.social.equipment_trade',
    name: 'Trade Equipment',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'eye',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'camp', 'fort'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (RB_DIFFICULTY_BASE - 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 0.80, condition: 0.20 },
          },
        },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'Rangers at {location} between patrols trade surplus equipment the way the Brotherhood ' +
          'trades everything: practically, without sentiment. A bow that pulls left is a problem ' +
          'on the trail and a gift to the ranger whose left eye is dominant. A knife too heavy ' +
          'for close work is the right knife for someone who uses a heavy pack. {name} lay{s} ' +
          'out what the last three patrols made unnecessary. ' +
          '{?has_faction}The Brotherhood\'s equipment-trade protocol: name the defect first, then ' +
          'the use. A ranger who hides a defect is a ranger whose trade partner stops trusting ' +
          'them on the trail.{/has_faction}' +
          '{?no_faction}No formal protocol — just rangers who know that equipment that fits costs ' +
          'nothing to maintain and equipment that does not fit costs everything.{/no_faction}',
        successAfterimage:
          'A straight-pulling bow and a light knife that sits the right way on {their} hip. ' +
          'The ranger who took the left-pulling bow seems satisfied. Practical people, practical trade.',
        failureAfterimage:
          'Nothing worth swapping today. The surplus is either too specific or too worn. {name} ' +
          'packs it back. The next patrol may produce something more tradeable.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The rangers at {location} are trading equipment between patrol rotations. ' +
        '{name} has surplus and needs.',
      success:
        'Good trade. Straight bow, better knife, lighter pack. The next patrol will be easier ' +
        'for it.',
      failure:
        'Nothing useful in the pool today. {name} keeps the old gear and notes what to look for ' +
        'next time.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The equipment trade at {location} is done. What {name} carries out of the exchange ' +
          'will either improve the next patrol or it will not.',
        changes: [
          {
            id: 'equipment_standing',
            kind: 'reputation',
            title: 'Equipment Exchange',
            detail: 'Rangers who trade honestly are rangers whose gear you can trust when they hand it to you.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god note from the equipment exchange?',
        reactions: [
          {
            id: 'equipment_tally',
            label: 'Practical trade. The Brotherhood maintains its gear.',
            intent: 'A clean exchange, honestly done. The kind of maintenance that keeps rangers in the field.',
            effects: [
              { kind: 'reputation_tally', key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Join & Promotion ─────────────────────────────────────────────────────

export const RB_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'rb.join',
  name: 'Join the Rangers Brotherhood',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  reach: 'eye',
  crudType: 'update',
  scale: 'local',
  locationSubtypes: ['town', 'camp', 'fort'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  steps: [
    {
      reach: 'eye',
      duration: { min: 1, max: 1 },
      difficulty: RB_JOIN_DIFFICULTY / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: { reputationDelta: 0.0 },
      failureMetadata: { reputationDelta: 0.0 },
      narrativeTemplate:
        'The Brotherhood\'s entrance trial at {location} is conducted in the open, not in a hall. ' +
        'A senior ranger releases a quarry — an old dog, well-trained, no collar — into the ' +
        'rough country west of the post and gives {name} a full day to bring back proof of ' +
        'the find. No weapons, no tracking kit. Just eyes and time. ' +
        '{?has_faction}A ranger who knows the Brotherhood\'s method will note that the dog\'s ' +
        'handler walked it past the northwest thicket twice before the trial started. ' +
        '{name} note{s} this.{/has_faction}' +
        '{?no_faction}No prior knowledge of how the Brotherhood tests. {name} read{s} the ' +
        'country with what {they} know{s}, which is what the trial is actually measuring.{/no_faction}',
      successAfterimage:
        'The dog was in the northwest thicket, exactly where the handler\'s second pass pointed. ' +
        '{name} found it by the third hour and waited the rest of the day in comfortable company ' +
        'before coming back in. The senior ranger looks at the return time. Nods. "You rested."',
      failureAfterimage:
        '"You worked too hard," the senior ranger says, not unkindly. "The dog was where the ' +
        'handler walked it. Come back when you\'ve learned to read the person, not just ' +
        'the country."',
    },
  ],
  narrativeTemplates: {
    initiation:
      'The Brotherhood at {location} is taking applications. {name} stands for the field trial.',
    success:
      'A new scout on the Brotherhood\'s roster. {name} found the dog and, more importantly, ' +
      'knew why the trial was designed the way it was.',
    failure:
      'Not today. The senior ranger was specific about what was missing. {name} will be back ' +
      'when they have learned to read the whole scene, not just the trail.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The Brotherhood trial at {location} is complete. {name} either joins the roster today ' +
        'or has a specific gap to close before the next attempt.',
      changes: [
        {
          id: 'join_outcome',
          kind: 'faction_reputation',
          title: 'Brotherhood Trial',
          detail: 'The Brotherhood measures field judgment, not performance. The trial is designed to show the difference.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'What does the god note about {name}\'s first encounter with the Brotherhood?',
      reactions: [
        {
          id: 'join_accepted',
          label: '{name} is on the roster.',
          intent: 'The Brotherhood has a new scout. The trial measured what it was designed to measure.',
          effects: [
            {
              kind: 'faction_reputation_gain',
              factionId: 'rangers_brotherhood',
              amount: 0.05,
            },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const RB_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'rb.promotion',
  name: 'Ranger Advancement',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'iron',
  crudType: 'update',
  scale: 'local',
  locationSubtypes: ['town', 'camp', 'fort'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
  steps: [
    {
      reach: 'iron',
      duration: { min: 2, max: 2 },
      difficulty: RB_PROMOTION_DIFFICULTY / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: { reputationDelta: 0.0 },
      failureMetadata: { reputationDelta: 0.0 },
      narrativeTemplate:
        'The Brotherhood\'s promotion trial is seven days alone in the deep country near {location}, ' +
        'with a compass, a fire-kit, and a single meal\'s worth of food. The Brotherhood calls it ' +
        'the endurance trial; the senior rangers call it the week the trail teaches you the ' +
        'difference between what you know and what you can do. {name} takes the bearing into ' +
        'the country and does not look back. ' +
        '{?has_faction}A Brotherhood ranger who has passed the trial will not discuss what happened ' +
        'during it. That is part of the protocol. The week belongs to the ranger and the country.{/has_faction}' +
        '{?no_faction}Seven days. Whatever {name} carries in — skill, instinct, judgment — is ' +
        'what {they} ha{s} to work with. The country does not adjust for prior rank.{/no_faction}',
      successAfterimage:
        '{name} walks back in on the seventh morning, thinner and quieter than when {they} left. ' +
        'The senior ranger who hands back the roster sheet asks one question: "What did the ' +
        'country tell you that you didn\'t already know?" {name} answers without hesitation.',
      failureAfterimage:
        'Back on the fifth day, not the seventh. No injury, no emergency — just the honest ' +
        'acknowledgment that the country asked for something {name} did not yet have. ' +
        '"Come back in three months," the senior ranger says. "The country will still be there."',
    },
  ],
  narrativeTemplates: {
    initiation:
      'Higher rank in the Brotherhood requires the endurance trial. {name} takes the bearing ' +
      'into the deep country near {location}.',
    success:
      'Seven days. Returned with the answer the senior ranger was looking for. The rank is earned.',
    failure:
      'Five days. The country asked for more than {name} had. Come back in three months. ' +
      'The trial will be there.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The endurance trial near {location} is complete. {name} either carries a new rank ' +
        'or a specific gap to close over the next season.',
      changes: [
        {
          id: 'promotion_outcome',
          kind: 'faction_reputation',
          title: 'Advancement Review',
          detail: 'The Brotherhood measures what seven days in the deep country reveals, not what a year of reports suggests.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'What does the god take from the seven days in the deep country?',
      reactions: [
        {
          id: 'promotion_advanced',
          label: 'The rank is earned. The country agreed.',
          intent:
            'The Brotherhood\'s trial produced the right answer. {name} carries a higher rank ' +
            'and, more importantly, the knowledge of what it cost.',
          effects: [
            {
              kind: 'faction_reputation_gain',
              factionId: 'rangers_brotherhood',
              amount: 0.05,
            },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'promotion_gap',
          label: 'Five days was honest. The three-month gap will close it.',
          intent: 'The Brotherhood respects the honest acknowledgment more than a seven-day lie.',
          effects: [
            { kind: 'reputation_tally', key: 'eye.positive', delta: 1 },
          ],
          closeAfterSelection: true,
        },
      ],
    },
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
