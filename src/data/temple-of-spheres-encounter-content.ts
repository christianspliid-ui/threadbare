/**
 * Temple of Spheres Encounter Content — fully migrated (THR-99).
 *
 * Voice bible: cosmological-that-weighs. Measured, precise,
 * technical-about-the-metaphysical. The Temple does not pray to the spheres —
 * it aligns with them. Characters read the weight, open the passage, hold the
 * orbit, close the rite. They do not invoke, beseech, worship, or venerate.
 *
 * Load-bearing lexicon: nine, weight, alignment, turning, open sphere, closed
 * sphere, mote, orbit, passage. Never: god.
 *
 * The in-file benchmark: ts.quest.tend_shrine (close to bar on THR-31 pass).
 * "The Temple does not praise this. The Temple notices it." is the voice in
 * one sentence.
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

const TS_DIFFICULTY_BASE = 25;
const TS_DIFFICULTY_STEP = 10;
const TS_SENIOR_BASE = 40;
const TS_ELITE_BASE = 55;
const TS_JOIN_DIFFICULTY = 20;
const TS_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const TEMPLE_OF_SPHERES_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  ['ts.join', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.0, questType: 'standard' }],
  ['ts.promotion', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.0, questType: 'standard' }],
  ['ts.quest.tend_shrine', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.04, questType: 'standard' }],
  ['ts.quest.heal_the_sick', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.04, questType: 'standard' }],
  ['ts.quest.meditate_on_spheres', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.04, questType: 'standard' }],
  ['ts.quest.consecrate_ground', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.05, questType: 'standard' }],
  ['ts.quest.copy_scriptures', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.05, questType: 'standard' }],
  ['ts.senior.sphere_communion', { factionDefId: 'temple_of_spheres', minRank: 'high_priest', reputationReward: 0.06, questType: 'senior' }],
  ['ts.senior.banish_corruption', { factionDefId: 'temple_of_spheres', minRank: 'high_priest', reputationReward: 0.06, questType: 'senior' }],
  ['ts.senior.craft_relic', { factionDefId: 'temple_of_spheres', minRank: 'high_priest', reputationReward: 0.06, questType: 'senior' }],
  ['ts.elite.sphere_convergence', { factionDefId: 'temple_of_spheres', minRank: 'pontifex', reputationReward: 0.08, questType: 'elite' }],
  ['ts.elite.found_cathedral', { factionDefId: 'temple_of_spheres', minRank: 'pontifex', reputationReward: 0.08, questType: 'elite' }],
  ['ts.social.evening_prayer', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.02, questType: 'standard' }],
  ['ts.social.alms_giving', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.02, questType: 'standard' }],
  ['ts.social.theological_debate', { factionDefId: 'temple_of_spheres', minRank: 'acolyte', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Standard Quest Templates ─────────────────────────────────────────────

export const TEMPLE_OF_SPHERES_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [

  withEncounterContract({
    id: 'ts.quest.tend_shrine',
    name: 'Tend the Shrine',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['shrine', 'temple', 'town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TS_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The shrine at {location} has grown quiet — offerings stale, the arrangement ' +
          'off-axis. {name} reads the weight before touching anything. ' +
          '{?has_artifact}The {artifact:any} {they} carry{s} hums at a different mote than the ' +
          'shrine\'s dominant sphere. {name} set{s} it aside rather than introduce competing ' +
          'weight.{/has_artifact}' +
          '{?no_artifact}Nothing to help or hinder. Just {them} and the nine.{/no_artifact}',
        successAfterimage:
          'The dominant sphere is identified. The passage is clear. The offering can proceed ' +
          'in correct orbit.',
        failureAfterimage:
          'The weight is ambiguous — two spheres competing at this site. {name} work{s} from ' +
          'the stronger one and accepts the compromise.',
      },
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: (TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.03,
          tierPromotionEligible: true,
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{?has_faction}The Temple{/has_faction} requires the closing rite: nine offerings, ' +
          'one for each sphere, with the heaviest offered last. {name} work{s} in silence. ' +
          'The alignment is slow to settle but settles.',
        successAfterimage:
          'The rite closes with the weight held. ' +
          'The Temple does not praise this. The Temple notices it.',
        failureAfterimage:
          'The rite holds at a compromise. The mote of the dominant sphere is still tilted. ' +
          'The Temple asks {name} when {they} would like to come back.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A shrine at {location} has fallen out of alignment — the offerings stale, the weight ' +
        'off-axis. {name} is assigned to restore the correct orbit.',
      success:
        'The shrine sits in correct orbit again. The Temple noticed the passage was clean.',
      failure:
        'The closing rite held at a compromise. The shrine is better than it was, not yet ' +
        'what it should be.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} worked the shrine at {location} back into alignment. The nine are in ' +
          'better orbit than before.',
        changes: [
          {
            id: 'ts_tend_shrine_standing',
            kind: 'reputation_tally',
            title: 'Sphere Standing',
            detail:
              'The Temple tracks every alignment restored. Small work, accumulated.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the work leave behind?',
        reactions: [
          {
            id: 'ts_tend_shrine_seed',
            label: 'This shrine should be the starting point for the communion work.',
            intent:
              'A restored shrine at correct weight is an ideal site for higher rites. ' +
              '{name} notes it for future use.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'ts.senior.sphere_communion',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS,
                seedLabel: 'Restored shrine at {location} is ready for sphere communion work',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ts_tend_shrine_tally',
            label: 'The shrine work is filed and the orbit is logged.',
            intent:
              'The Temple\'s weight record accumulates. Each tended shrine is a data point ' +
              'in the great turning.',
            effects: [
              { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
              { kind: 'reputation_tally', key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'ts.quest.heal_the_sick',
    name: 'Heal the Sick',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital', 'village'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TS_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The sick at {location} carry a misalignment in the body — one sphere too open, ' +
          'one too closed. {name} must read the weight before attempting passage. ' +
          '{?has_artifact}The {artifact:any} responds to the body\'s off-axis mote, pulling ' +
          'slightly toward the heavier sphere. {name} use{s} it as a reading instrument ' +
          'rather than a tool.{/has_artifact}' +
          '{?has_faction}The Temple teaches that every illness is a sphere argument — ' +
          'the treatment is identifying which side is losing.{/has_faction}',
        successAfterimage:
          'The dominant sphere of the misalignment is found. The passage is mapped. ' +
          'The turning can begin from the correct side.',
        failureAfterimage:
          'Two spheres are competing at roughly equal weight. {name} proceed{s} on the ' +
          'more probable one and accounts for the uncertainty in the approach.',
      },
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: (TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          tierPromotionEligible: true,
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'Healing is a slow turning — the orbit must shift naturally or the mote displaces ' +
          'and the body fights back harder. {name} work{s} with the patient\'s own weight ' +
          'rather than against it. The passage takes the time it takes.',
        successAfterimage:
          'The alignment shifts. The sick body\'s weight finds orbit again. ' +
          'The Temple notes the passage: clean work, correct timing.',
        failureAfterimage:
          'The turning was too fast or the patient\'s sphere resistance too strong. ' +
          'The alignment holds at a compromise — reduced misalignment, not corrected. ' +
          'The Temple says: that is sometimes what the passage allows.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The sick carry a misalignment — one sphere too open, one too closed. ' +
        '{name} has been asked to read the weight and turn the orbit back toward health.',
      success:
        'The body\'s weight is in better orbit. The Temple recorded the passage as clean.',
      failure:
        'The turning held at a compromise. The patient is better than they were. ' +
        'The misalignment is reduced, not corrected.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} worked the sick at {location} back toward alignment. ' +
          'The body\'s weight is in better orbit than before the passage.',
        changes: [
          {
            id: 'ts_heal_rep',
            kind: 'reputation_tally',
            title: 'Healing Work',
            detail:
              'The Temple tracks sphere-alignment healings. Each recorded passage adds ' +
              'to the weight map of known misalignment patterns.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does this healing leave behind?',
        reactions: [
          {
            id: 'ts_heal_mark',
            label: 'The healing was witnessed. The spheres will remember the alignment offered.',
            intent:
              'A healer who works with sphere alignment rather than against it leaves ' +
              'a cosmological trace — the patient\'s restored orbit is a mark on both of them.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'divine_favor',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label: '{name} performed a sphere-alignment healing at {location}',
              },
              { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ts_heal_tally',
            label: 'The passage is logged and the pattern is filed in the Temple weight record.',
            intent:
              'Every recorded healing teaches the Temple something about the sphere argument ' +
              'patterns of this region. The data accumulates.',
            effects: [
              { kind: 'reputation_tally', key: 'heart.positive', delta: 2 },
              { kind: 'reputation_tally', key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'ts.quest.meditate_on_spheres',
    name: 'Meditate on the Spheres',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'star',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['shrine', 'temple', 'tower', 'wilderness'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: TS_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          '{name} seeks the quiet at {location} — the particular silence where the nine ' +
          'are in least argument with each other. The Temple calls this the resting orbit. ' +
          '{?has_faction}Acolytes find it in three minutes. High priests find it in thirty ' +
          'seconds. The difference is how much of the orbit {they} stop{s} carrying ' +
          'personally.{/has_faction}',
        successAfterimage:
          'The resting orbit is found. The nine settle at minimum argument. ' +
          '{name} hold{s} it and waits to see what becomes visible at this weight.',
        failureAfterimage:
          'The nine are arguing tonight. {name} hold{s} three and loses two. ' +
          'The Temple does not judge this — the orbit resists many hands, ' +
          'and three is still a reading.',
      },
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: (TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          tierPromotionEligible: true,
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{?has_faction}The Temple requires the naming:{/has_faction} which sphere was ' +
          'loudest in the room? Which alignment has shifted since last {name} was here? ' +
          'The observation belongs in the Temple\'s weight record, not in {their} ' +
          'private notes.',
        successAfterimage:
          'Named precisely. The sphere that was loudest, the alignment that had shifted, ' +
          'the mote that was off-axis. The Temple adds the observation to its weight record ' +
          'without comment, which is acceptance.',
        failureAfterimage:
          'Named imprecisely — two possible spheres, uncertain which was dominant. ' +
          'The Temple adds both possibilities and asks {name} to return with a cleaner read ' +
          'when the orbit is less contested.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} seeks the resting orbit at {location} — the quiet where the nine are in ' +
        'least argument — and will name what becomes visible at that weight.',
      success:
        'The observation is precise and added to the Temple\'s weight record. ' +
        'The resting orbit was held and what it revealed was named correctly.',
      failure:
        'The naming was imprecise. The Temple accepted it with both possibilities noted ' +
        'and asked for a cleaner read.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} found the resting orbit at {location} and named what the nine revealed ' +
          'at that weight. The observation is in the Temple\'s record.',
        changes: [
          {
            id: 'ts_meditate_standing',
            kind: 'reputation_tally',
            title: 'Observation Logged',
            detail:
              'The Temple weight record grows by one more precise observation. ' +
              'The pattern of sphere-argument in this region becomes slightly clearer.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the resting orbit open toward?',
        reactions: [
          {
            id: 'ts_meditate_seed',
            label:
              'The resting orbit here is stable enough for communion work.',
            intent:
              'A site where the nine settle into quiet orbit is rare. ' +
              '{name} marks it for the higher rite.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'ts.senior.sphere_communion',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS,
                seedLabel:
                  '{location} holds a stable resting orbit — suitable for sphere communion',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ts_meditate_tally',
            label: 'The observation is filed. The nine are better known here than before.',
            intent:
              'Accumulating precise observations is the Temple\'s primary work. ' +
              'This one matters.',
            effects: [
              { kind: 'reputation_tally', key: 'star.positive', delta: 1 },
              { kind: 'reputation_tally', key: 'veil.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'ts.quest.consecrate_ground',
    name: 'Consecrate the Ground',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'heart',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: ['wilderness', 'ruins', 'town', 'village'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TS_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The ground at {location} is being prepared for a shrine. {name} weighs it ' +
          'first — which spheres are already present in the soil and stone, which are ' +
          'absent, which are in argument. The consecration must account for what is ' +
          'already here. ' +
          '{?has_artifact}The {artifact:any} resonates differently when {name} hold{s} ' +
          'it near the candidate site — a sphere-pressure the ground is already ' +
          'carrying.{/has_artifact}' +
          '{?has_faction}The Temple\'s reading protocol: stones first, then soil, ' +
          'then the air six feet above the ground.{/has_faction}',
        successAfterimage:
          'The site\'s natural alignment is read cleanly. One sphere dominant, ' +
          'two absent, the rest at resting weight. The consecration can proceed ' +
          'with that map in hand.',
        failureAfterimage:
          'The site is louder than expected — one sphere very open, another ' +
          'pushing back. The consecration must account for a contested ground, ' +
          'not a neutral one.',
      },
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: (TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          tierPromotionEligible: true,
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{?has_faction}The Temple\'s rite{/has_faction} opens the ground to all nine ' +
          'in sequence — not equally, but in proportion to what the site will carry. ' +
          '{name} work{s} from the site\'s natural dominant sphere outward, coaxing the ' +
          'others to accept the orbit rather than forcing them.',
        successAfterimage:
          'The ground holds the opening. The nine are in proportion, the dominant ' +
          'sphere clear, the others present. The shrine can be placed on ground ' +
          'that knows what it is.',
        failureAfterimage:
          'One sphere did not open to the correct proportion. The consecration is ' +
          'partial — the site can hold a lesser shrine, not a full one. ' +
          'The Temple records this as a partial consecration pending the missing passage.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'Ground at {location} must be read and consecrated before a shrine can be placed. ' +
        '{name} will weigh the site and open it to all nine spheres in proportion.',
      success:
        'The ground holds full consecration. The shrine can be placed on ground ' +
        'that knows its alignment.',
      failure:
        'The consecration is partial — one sphere withheld its passage. ' +
        'The Temple records this and will attempt the missing passage at the next turning.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} read the ground at {location} and worked it open to the nine. ' +
          'A consecrated site changes a place\'s weight permanently.',
        changes: [
          {
            id: 'ts_consecrate_ground_change',
            kind: 'future_hook',
            title: 'Ground Consecrated',
            detail:
              'Consecrated ground changes the sphere-weight of encounters at this site. ' +
              'Acolytes will feel it. So will those who work against the Temple\'s orbit.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the consecration leave behind?',
        reactions: [
          {
            id: 'ts_consecrate_mark',
            label:
              'The nine witnessed this consecration. The spheres will remember the ground.',
            intent:
              'Consecrated ground carries a permanent mark — the spheres recorded ' +
              'the opening and will weight future passages at this site accordingly.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'mystical_contract',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label: 'Ground at {location} consecrated to the nine — sphere-weight shifted',
              },
              {
                kind: 'encounter_seed',
                templateId: 'ts.quest.tend_shrine',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 3,
                seedLabel:
                  'Newly consecrated ground at {location} will need its first tending',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ts_consecrate_tally',
            label:
              'The consecration is logged. The Temple\'s network of weight-tracked sites grows.',
            intent:
              'Every consecrated site is a node in the Temple\'s weight map of the world. ' +
              'The more nodes, the better the Temple understands the nine in this region.',
            effects: [
              { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
              { kind: 'reputation_tally', key: 'stone.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'ts.quest.copy_scriptures',
    name: 'Copy the Scriptures',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'star',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: ['shrine', 'temple', 'tower', 'city'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: TS_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The scriptures carry the alignment of the scribe who first wrote them — ' +
          'the sphere-weight of their hand and orbit on the day the text was committed. ' +
          '{name} must feel that weight before copying. A technically accurate copy ' +
          'with the wrong orbit is still a wrong copy. ' +
          '{?has_artifact}The {artifact:any} {they} carry{s} vibrates slightly at ' +
          'certain passages — the sphere-weight of the artifact and the text are ' +
          'not perfectly aligned. {name} note{s} which passages and will account ' +
          'for them.{/has_artifact}' +
          '{?has_faction}The Temple\'s copyists say: if you cannot feel the original ' +
          'scribe\'s dominant sphere in the first paragraph, do not begin.{/has_faction}',
        successAfterimage:
          'The original alignment is felt cleanly — a star-heavy hand, measured ' +
          'and precise, with a secondary weight toward heart in the devotional passages. ' +
          'The copy will carry it.',
        failureAfterimage:
          'The original alignment is unclear — the scribe may have been at a turning ' +
          'point in their own orbit when they wrote this. {name} will copy accurately ' +
          'but the sphere-weight will be approximate.',
      },
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: (TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          tierPromotionEligible: true,
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The Temple at {location}{?has_faction} requires the copy for a new shrine{/has_faction}. ' +
          'Each passage must be written in the orbit of the sphere it addresses — ' +
          'the passage about the open sphere written in an open hand, the passage about ' +
          'the closed sphere written carefully, with held breath. {name} work{s} ' +
          'through the full text this way.',
        successAfterimage:
          'The copy is clean and properly weighted. ' +
          'The Temple receives it without comment, which is approval.',
        failureAfterimage:
          'One passage slipped orbit — the hand moved faster than the sphere-attention ' +
          'could follow. The Temple will have a senior scribe correct the mote ' +
          'before the copy is placed in service.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'Scriptures need copying for a new shrine at {location}. {name} must read the ' +
        'sphere-weight of the original before beginning — a copy that does not carry the ' +
        'original\'s orbit is technically accurate but spiritually approximate.',
      success:
        'The copy is clean and sphere-weighted correctly. The Temple accepted it ' +
        'without comment.',
      failure:
        'One passage slipped orbit. The Temple will have a senior scribe correct it ' +
        'before use.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} copied the scriptures at {location} with the original\'s sphere-weight ' +
          'preserved. The text now exists in two properly weighted copies.',
        changes: [
          {
            id: 'ts_copy_rep',
            kind: 'reputation_tally',
            title: 'Scribe Work',
            detail:
              'The Temple\'s body of correctly weighted texts grows by one. ' +
              'A small thing until a shrine needs to open and only one weighted copy exists.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the copying teach?',
        reactions: [
          {
            id: 'ts_copy_seed',
            label:
              'This text carries something worth returning to — the original weight points toward a larger rite.',
            intent:
              'The sphere-weight of a well-copied text accumulates across readings. ' +
              '{name} marks this copy as a foundation for future study.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'ts.quest.meditate_on_spheres',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS,
                seedLabel:
                  'The copied scriptures at {location} are worth meditating on — ' +
                  'the original weight is instructive',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ts_copy_tally',
            label: 'The copy is filed. The weight is recorded.',
            intent:
              'Another sphere-weighted text in the Temple\'s collection. ' +
              'The orbit of the written word is preserved.',
            effects: [
              { kind: 'reputation_tally', key: 'star.positive', delta: 1 },
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

export const TEMPLE_OF_SPHERES_SENIOR_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'ts.senior.sphere_communion',
    name: 'Sphere Communion',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'star',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['shrine', 'temple', 'tower', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: TS_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{name} enters the ritual space at {location} already weighted — the Temple ' +
          'has been watching the alignment shift over the past passage and this is the ' +
          'scheduled accounting. The room holds nine stations. At each station, one sphere ' +
          'is dominant. The entry reading establishes what {name} bring{s} to the orbit ' +
          'before the formal work begins.' +
          '{?has_faction} The high priest stands aside and says nothing during the entry read. ' +
          'Interference at entry corrupts the baseline.{/has_faction}',
        successAfterimage:
          'The entry is clean. All nine are present in the room. The orbit is still. ' +
          '{name} know{s} the weight {they} carry{s} and what {they} must account for ' +
          'when the holding begins.',
        failureAfterimage:
          'Three spheres resist the entry — the weight {name} carry{s} today is ' +
          'incompatible with their dominant orbit. The communion will proceed, ' +
          'but only with the open spheres. The Temple notes the three that refused.',
      },
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: (TS_SENIOR_BASE + TS_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The weight of all nine must be held simultaneously{?has_faction} — ' +
          'the Temple calls this the full turning{/has_faction}. Most practitioners ' +
          'manage six. Seven is distinguished. Eight is rare enough that the Temple ' +
          'records the date and the weather. Nine is theoretical — no confirmed record ' +
          'in the current annal.',
        successAfterimage:
          'Seven spheres held. The weight is real and felt in the hands. ' +
          'The Temple does not say this is exceptional. ' +
          'The Temple asks what {name} noticed at seven.',
        failureAfterimage:
          'Five held. The other four fell at different moments — the first pair early, ' +
          'the second pair at the three-quarter mark. The Temple says: that is still ' +
          'the majority. Come back when the other two feel closer.',
      },
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: TS_SENIOR_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          tierPromotionEligible: true,
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'What was the heaviest sphere at the height of the communion? Which orbit ' +
          'was most resistant? Where did the weight shift unexpectedly? The Temple\'s ' +
          'record needs the observation before the alignment fades from memory — ' +
          'the weight will shift within hours.',
        successAfterimage:
          'Reported precisely: heaviest sphere named, resistant orbit identified, ' +
          'unexpected shift logged. The Temple adds it to the weight record. ' +
          'The observation will be useful in the next turning.',
        failureAfterimage:
          'The observation is approximate — the weight faded faster than ' +
          '{name} could name it. The Temple accepts the approximation and marks it ' +
          'as such in the record.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is scheduled for the sphere communion rite at {location} — ' +
        'the formal accounting where all nine must be held simultaneously and ' +
        'what was noticed reported precisely.',
      success:
        'Seven spheres held. The observation was reported precisely and added to the ' +
        'Temple\'s weight record.',
      failure:
        'Five held. The approximation is in the record. The Temple recommends ' +
        'returning when the other two feel closer.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} completed the sphere communion rite at {location}. ' +
          'The observation is in the Temple\'s weight record. ' +
          'The nine were counted and what was held is known.',
        changes: [
          {
            id: 'ts_communion_standing',
            kind: 'reputation_tally',
            title: 'Communion Record',
            detail:
              'The number of spheres held and what was observed at the height are now ' +
              'part of the Temple\'s permanent weight map for this practitioner.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the communion open toward?',
        reactions: [
          {
            id: 'ts_communion_mark',
            label:
              'The spheres witnessed this communion. That weight belongs in the record.',
            intent:
              'A communion at this depth leaves a cosmological trace. ' +
              'The spheres that were held will recognize the holder in future rites.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'divine_favor',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label:
                  '{name} completed sphere communion — held seven at {location}; ' +
                  'the spheres noted the weight',
              },
              {
                kind: 'encounter_seed',
                templateId: 'ts.elite.sphere_convergence',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 2,
                seedLabel:
                  '{name}\'s communion work at {location} has reached the depth ' +
                  'that makes convergence meaningful',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ts_communion_tally',
            label:
              'The observation is filed. Seven spheres held is a data point worth keeping.',
            intent:
              'The Temple weight record reflects this communion as contribution. ' +
              'The pattern of what {name} can hold is now better mapped.',
            effects: [
              { kind: 'reputation_tally', key: 'star.positive', delta: 2 },
              { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ts.senior.banish_corruption',
    name: 'Banish the Corruption',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'star',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['ruins', 'dungeon', 'town', 'city'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: TS_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The corruption at {location} is a closed sphere — one that should be open ' +
          'is sealed, and whatever sealed it has been feeding on the pressure ever since. ' +
          '{name} must name the closed sphere before the weight can be addressed. ' +
          '{?has_faction}The Temple teaches: do not attempt to open a sphere you cannot ' +
          'name. Unnamed pressure always routes to the wrong passage.{/has_faction}',
        successAfterimage:
          'The closed sphere is named — the one whose absence has let the others ' +
          'distort and fill. The weight of the corruption makes sense now. ' +
          'The address can begin from a known position.',
        failureAfterimage:
          'Two spheres are candidates — both are restricted at this site, both have ' +
          'distortion patterns consistent with what {name} observe{s}. ' +
          '{name} proceed{s} on the more probable one and holds the other as contingency.',
      },
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: (TS_SENIOR_BASE + TS_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.05,
          tierPromotionEligible: true,
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          '{?has_faction}The Temple teaches{/has_faction}: a closed sphere is not ' +
          'destroyed — it is held shut by weight on one side. The corruption is that ' +
          'weight, accumulated over time, pressing against the passage. Remove the ' +
          'weight and the sphere opens. {name} work{s} at the point of pressure, ' +
          'not at the symptom.',
        successAfterimage:
          'The sphere opens. The corruption dissolves as the orbit restores — ' +
          'not destroyed, but deprived of its mechanism. The Temple notes the passage ' +
          'was clean: named correctly, addressed at the source, resolved without ' +
          'forcing the adjacent spheres.',
        failureAfterimage:
          'The sphere opens partially. The corruption is reduced but not gone — ' +
          'the weight that held it is deeper than one passage can address. ' +
          'What remains is smaller and slower. The Temple will send someone back.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A corruption at {location} — a sphere sealed by accumulated weight, feeding ' +
        'on the pressure. {name} must name the closed sphere and open what was shut.',
      success:
        'The sphere is open. The corruption is gone, deprived of its mechanism. ' +
        'The Temple recorded the address as clean.',
      failure:
        'Partial. The corruption is reduced. The Temple will return for the remainder.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} named the closed sphere at {location} and worked it open. ' +
          'The corruption that fed on the pressure is dissolved or reduced. ' +
          'The site is better than it was.',
        changes: [
          {
            id: 'ts_banish_change',
            kind: 'future_hook',
            title: 'Corruption Addressed',
            detail:
              'The sphere that was sealed is now open — or more open. ' +
              'What held it shut may have come from somewhere specific.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What did the banishment reveal?',
        reactions: [
          {
            id: 'ts_banish_intelligence',
            label:
              'Something created this corruption. The weight did not accumulate by accident.',
            intent:
              'A closed sphere with this kind of pressure has a source — a place, ' +
              'a forced passage, an agent working against the orbit. ' +
              '{name} found traces of it in the opening.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Corruption source identified at {location}',
                detail:
                  'The sphere that was sealed bears traces of deliberate forcing — ' +
                  'the weight was not accumulated passively. Something or someone ' +
                  'has been holding this passage closed. The sphere-pressure pattern ' +
                  'matches forced closures seen in [specific context to be resolved ' +
                  'per game state]. This intelligence is consumable in future rites.',
                reliability: 0.75,
              },
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label:
                  '{name} holds intelligence about the forced-closure source at {location}',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ts_banish_tally',
            label:
              'The banishment is logged. The sphere is open. The Temple adds this to the ' +
              'regional weight map.',
            intent:
              'A banished corruption changes the sphere-pressure of a region. ' +
              'The Temple needs to know where it happened and how it was resolved.',
            effects: [
              { kind: 'reputation_tally', key: 'star.positive', delta: 2 },
              { kind: 'reputation_tally', key: 'shadow.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ts.senior.craft_relic',
    name: 'Craft a Sphere Relic',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'star',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: ['temple', 'tower', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: TS_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'A relic carries the weight of one sphere most heavily. {name} must choose ' +
          'which sphere the object will hold{?has_faction} — the Temple will judge ' +
          'whether the choice fits the purpose{/has_faction}. ' +
          '{?has_artifact}The {artifact:any} already carries a sphere-alignment. ' +
          '{name} can use it as the seed material — the relic will be weighted toward ' +
          'the artifact\'s dominant sphere, and the choice is already half-made by ' +
          'what {they} carry{s}.{/has_artifact}' +
          '{?no_artifact}The material is neutral — whatever sphere {name} choose{s} ' +
          'will have to be introduced from the beginning, against no prior weight.{/no_artifact}',
        successAfterimage:
          'The dominant sphere is chosen and the choice is ratified. The object ' +
          'accepts the orbit. The crafting begins with that weight committed.',
        failureAfterimage:
          'The choice is contested by the material itself — it wants a different ' +
          'weight than {name} selected. {name} proceed{s} against the grain, ' +
          'knowing the relic will carry a slight misalignment at its center.',
      },
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: (TS_SENIOR_BASE + TS_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.05,
          tierPromotionEligible: true,
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The object is set in the orbit of its dominant sphere. The remaining eight ' +
          'must be present but lighter — an alignment, not a balance. A balance means ' +
          'no sphere is primary. That is not a relic; that is a weight. ' +
          '{name} work{s} each of the eight in, testing after each one that the ' +
          'dominant sphere still holds its primacy.',
        successAfterimage:
          'The orbit is set and holds. The relic carries the intended alignment — ' +
          'one sphere clearly dominant, eight present but subordinate. ' +
          'The Temple receives it without comment, which is approval.',
        failureAfterimage:
          'The orbit is approximate. The dominant sphere holds, but two of the eight ' +
          'are heavier than they should be, pulling the alignment slightly off-center. ' +
          'The Temple will use it, noting the imprecision in the record.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is crafting a sphere relic — an object weighted to carry one sphere ' +
        'most heavily, with the other eight present but subordinate.',
      success:
        'The relic is properly aligned. One sphere dominant, eight present. ' +
        'The Temple accepted it without comment.',
      failure:
        'The alignment is approximate. The dominant sphere holds but two of the ' +
        'eight are heavier than intended. The Temple noted the imprecision.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} crafted a sphere relic at {location}. The object now carries a ' +
          'specific sphere-alignment that will affect every rite it participates in.',
        changes: [
          {
            id: 'ts_relic_change',
            kind: 'item',
            title: 'Relic Crafted',
            detail:
              'A sphere-aligned relic can change the character of rites performed ' +
              'with it. The dominant sphere becomes easier to work with; the others ' +
              'shift in response.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the relic\'s orbit open toward?',
        reactions: [
          {
            id: 'ts_relic_mark',
            label:
              'The crafting was witnessed by the spheres. The relic carries a mark ' +
              'from its creation.',
            intent:
              'A relic made at this level of precision carries a cosmological trace ' +
              'of its making — the sphere-weight of the craftsman, the dominant sphere ' +
              'chosen, the moment the orbit was set.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'mystical_contract',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label: '{name} crafted a sphere relic; the dominant sphere is recorded',
              },
              {
                kind: 'encounter_seed',
                templateId: 'ts.senior.sphere_communion',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS,
                seedLabel:
                  'The new relic is ready for its first communion test — ' +
                  'how does it change the weight of the full turning?',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ts_relic_tally',
            label: 'The relic is logged in the Temple\'s weight inventory.',
            intent:
              'Every sphere-aligned relic in the Temple\'s network affects the region\'s ' +
              'total sphere-pressure. The inventory is the Temple\'s map of what it can ' +
              'bring to bear.',
            effects: [
              { kind: 'reputation_tally', key: 'star.positive', delta: 2 },
              { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Elite Quest Templates ────────────────────────────────────────────────

export const TEMPLE_OF_SPHERES_ELITE_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'ts.elite.sphere_convergence',
    name: 'Sphere Convergence',
    rarityTier: 1,
    intrinsicTier: 'story_beat',
    reach: 'star',
    crudType: 'update',
    scale: 'regional',
    locationSubtypes: ['shrine', 'temple', 'capital', 'tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: TS_ELITE_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.03 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The convergence requires nine practitioners, one weighted to each sphere. ' +
          '{name} read{s} the alignment of those gathered at {location} before the rite ' +
          'can begin — a practitioner at the wrong station introduces distortion that ' +
          'defeats the whole turning. ' +
          '{?has_artifact}The {artifact:any} {name} bring{s} shifts the sphere-weight ' +
          'of one station noticeably — it may allow a practitioner with a partial ' +
          'alignment to hold their sphere more cleanly.{/has_artifact}' +
          '{?has_faction}The pontifex\'s standing order: if two practitioners share ' +
          'a dominant sphere, the convergence does not begin. Asymmetric weight ' +
          'always routes to the open side.{/has_faction}',
        successAfterimage:
          'The nine weights are confirmed. Each practitioner\'s dominant sphere is ' +
          'distinct. The convergence can proceed with a clean station map.',
        failureAfterimage:
          'Two practitioners carry the same dominant sphere — the convergence will ' +
          'be asymmetric. One station will be doubled; one will be empty. ' +
          'Possible, but the turning will pull toward the doubled sphere.',
      },
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: (TS_ELITE_BASE + TS_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.03 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{?has_faction}The pontifex{/has_faction} calls the turning: each sphere must ' +
          'be held simultaneously by its designated practitioner. The orbit must run ' +
          'clean through all nine, each supporting the others rather than competing. ' +
          'When this works, it is not quiet. It is a very specific kind of loudness.',
        successAfterimage:
          'All nine held. The orbit runs clean for the full passage. ' +
          'The Temple does not describe what this feels like. ' +
          'The Temple says: that was a convergence.',
        failureAfterimage:
          'Seven held. Two dropped at the weight — one early, one at the three-quarter ' +
          'passage. The convergence produces a partial turning: significant, real, ' +
          'and not what it could have been.',
      },
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: TS_ELITE_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.06,
          tierPromotionEligible: true,
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The convergence produces an alignment that must be recorded immediately — ' +
          'what the nine were at the moment of full turning, what passage opened, ' +
          'what mote shifted in the region\'s orbit. The weight will begin shifting ' +
          'within hours. The record must be made while the alignment is still felt.',
        successAfterimage:
          'Record made while the alignment held. The Temple adds it to the ' +
          'convergence annal — one of very few complete records in the current century.',
        failureAfterimage:
          'Record made, but the weight had already begun shifting. ' +
          'The Temple notes the partial record with the time it was taken. ' +
          'Partial is better than absent.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'Nine practitioners, one for each sphere, convening at {location} for the full ' +
        'turning. {name} has been called to confirm the station map and hold the rite.',
      success:
        'All nine held. The convergence is complete and recorded in the annal. ' +
        'The Temple noted: that was a convergence.',
      failure:
        'Seven held. A partial turning, significant and real. ' +
        'The partial record is in the annal with the time it was taken.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} conducted or participated in a sphere convergence at {location}. ' +
          'The nine were aligned and held, producing a turning in the regional orbit ' +
          'that the Temple will be mapping for weeks.',
        changes: [
          {
            id: 'ts_convergence_change',
            kind: 'future_hook',
            title: 'Convergence Completed',
            detail:
              'A full convergence shifts the sphere-weight of a region measurably. ' +
              'The effects will be felt in rites performed here for some time.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What did the convergence open?',
        reactions: [
          {
            id: 'ts_convergence_intelligence',
            label:
              'The convergence revealed something about the regional orbit — ' +
              'a passage that is more open than expected.',
            intent:
              'A full convergence is diagnostic as much as it is operative. ' +
              'What was revealed about the sphere-weight of this region is worth recording ' +
              'as intelligence — it will affect future rites and future decisions.',
            effects: [
              {
                kind: 'intelligence',
                category: 'cultural_knowledge',
                label: 'Sphere convergence at {location} revealed regional orbit data',
                detail:
                  'The convergence revealed the regional sphere-weight with unusual ' +
                  'clarity — the dominant sphere, which passages are more open than ' +
                  'the standard map shows, and which are more closed. This intelligence ' +
                  'can inform future rite placement and corruption-banishment work.',
                reliability: 0.9,
              },
              {
                kind: 'hidden_mark',
                category: 'divine_favor',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label:
                  '{name} participated in a sphere convergence — the nine recorded ' +
                  'the participants',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ts_convergence_tally',
            label:
              'The convergence is logged in the annal. The Temple\'s weight map advances.',
            intent:
              'A completed convergence is the Temple\'s highest regular contribution to ' +
              'the regional sphere record. The participants are noted.',
            effects: [
              { kind: 'reputation_tally', key: 'star.positive', delta: 3 },
              { kind: 'reputation_tally', key: 'heart.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ts.elite.found_cathedral',
    name: 'Found a Cathedral',
    rarityTier: 1,
    intrinsicTier: 'story_beat',
    reach: 'heart',
    crudType: 'create',
    scale: 'regional',
    locationSubtypes: ['city', 'capital', 'town'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TS_ELITE_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'A cathedral at {location} must sit on ground that will hold all nine ' +
          'without argument for a generation. {name} survey{s} the possible sites — ' +
          'not for architectural fitness, but for sphere-weight. ' +
          '{?has_artifact}The {artifact:any} serves as a reading instrument. ' +
          'Held near each candidate site, it changes tone slightly. {name} maps the ' +
          'differences and follows the quietest.{/has_artifact}' +
          '{?has_faction}The Temple\'s founding doctrine: the ground must already ' +
          'hold a resting orbit before the first stone is placed. A cathedral ' +
          'built on contested ground will spend its life fighting its own site.{/has_faction}',
        successAfterimage:
          'The right ground is found — one site where no sphere is fighting for ' +
          'dominance, where the resting orbit is stable and has been for some time. ' +
          'The soil holds the weight evenly. This is the place.',
        failureAfterimage:
          'All available ground carries some imbalance. One site is better than the ' +
          'others — only two spheres in active argument rather than four. ' +
          'The cathedral will be built with that imbalance acknowledged in the ' +
          'founding record.',
      },
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: (TS_ELITE_BASE + TS_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.03 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{?has_faction}The Temple\'s founding rite{/has_faction} requires nine ' +
          'consecrations, each performed at the hour of its sphere\'s highest passage — ' +
          'spread across nine days, some in the middle of the night, one at ' +
          'the moment between noon and the first afternoon shadow. {name} keep{s} ' +
          'the schedule without deviation.',
        successAfterimage:
          'All nine consecrations completed at the correct hour. The ground is properly ' +
          'opened to the full turning. The cathedral has something to stand on.',
        failureAfterimage:
          'One consecration fell outside the passage window — the eighth sphere, ' +
          'attempted an hour late due to weather. The cathedral is founded with ' +
          'eight of nine. The ninth will be reattempted at the next passage.',
      },
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TS_ELITE_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.06,
          tierPromotionEligible: true,
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The first public rite in a new cathedral is the founding record: what the ' +
          'alignment was when the doors opened, what passage the nine were in, ' +
          'what {name}\'s weight among them was. This record will be read at every ' +
          'future founding anniversary. It must be made correctly.',
        successAfterimage:
          'The rite closes with the weight held. The cathedral is open. The Temple ' +
          'records the founding alignment — the nine at the moment the doors opened, ' +
          'and {name}\'s weight among them. A cathedral has been founded.',
        failureAfterimage:
          'The rite holds but the weight slips at the close — {name}\'s own orbit ' +
          'was not fully composed when the final passage was made. The cathedral ' +
          'is open. The Temple notes the imprecision in the founding record, gently.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A cathedral is being founded at {location}. {name} must find ground that ' +
        'holds the resting orbit, complete nine consecrations at the correct hour, ' +
        'and open the founding rite.',
      success:
        'The cathedral is founded with full alignment. The founding record is clean. ' +
        'A cathedral stands at {location}.',
      failure:
        'The cathedral is founded. One consecration was late; the imprecision is ' +
        'in the founding record. The Temple noted it gently.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} founded a cathedral at {location}. The site is consecrated, ' +
          'the nine are opened in the ground, and the founding rite is in the record. ' +
          'The weight of this place has changed permanently.',
        changes: [
          {
            id: 'ts_cathedral_change',
            kind: 'future_hook',
            title: 'Cathedral Founded',
            detail:
              'A founded cathedral changes the sphere-weight of its location ' +
              'and the surrounding region. The Temple\'s network grows by one node. ' +
              'Note: GraphOps aftermath for new location promotion is pending ' +
              'THR-99 follow-up when graphOpExecutor supports cathedral subtype.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does this cathedral anchor?',
        reactions: [
          {
            id: 'ts_cathedral_seed',
            label:
              'A new cathedral is the right scale for the convergence work — ' +
              'it should be the site of the first full turning.',
            intent:
              'A freshly founded cathedral with correct alignment is the ideal site ' +
              'for a sphere convergence. The ground is open and the nine are already ' +
              'present in correct proportion.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'mystical_contract',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label:
                  '{name} founded a cathedral at {location} — founding alignment recorded',
              },
              {
                kind: 'encounter_seed',
                templateId: 'ts.elite.sphere_convergence',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 3,
                seedLabel:
                  'The new cathedral at {location} is ready for its founding convergence',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ts_cathedral_tally',
            label: 'The founding is logged. The Temple\'s weight map gains a new anchor.',
            intent:
              'A cathedral in the Temple\'s network is a permanent sphere-weight node. ' +
              'The region\'s orbit will organize around it over time.',
            effects: [
              { kind: 'reputation_tally', key: 'heart.positive', delta: 3 },
              { kind: 'reputation_tally', key: 'stone.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Social Templates ─────────────────────────────────────────────────────

export const TEMPLE_OF_SPHERES_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [

  withEncounterContract({
    id: 'ts.social.evening_prayer',
    name: 'Evening Prayer',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'heart',
    crudType: 'update',
    scale: 'personal',
    locationSubtypes: ['shrine', 'temple', 'town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TS_DIFFICULTY_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          tierPromotionEligible: false,
        },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The evening count at {location} opens with the nine-breath — one breath ' +
          'for each sphere, lightest first, heaviest last. {name} join{s} the orbit. ' +
          '{?has_faction}In the Temple, this is not ceremonial. It is maintenance. ' +
          'The nine do not hold themselves open. Someone has to count them ' +
          'every evening.{/has_faction}' +
          '{?no_faction}Outside the Temple, most practitioners do not know about ' +
          'the count. {name} does. {they} do{s} it anyway.{/no_faction}',
        successAfterimage:
          '{name} hold{s} the orbit through all nine. The alignment is ' +
          'a little more true leaving than arriving. This is the whole point.',
        failureAfterimage:
          '{name} lose{s} the count at six. The seventh sphere slips ' +
          'before {they} can catch it. The Temple does not say anything. ' +
          'Six is still the majority.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The evening nine-count at {location}. One breath for each sphere, lightest ' +
        'first, heaviest last. The alignment is maintained this way.',
      success:
        'All nine held through the count. The alignment is a little more true ' +
        'than before.',
      failure:
        'The count broke at six. The Temple did not comment. Six is still the majority.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} completed the evening count at {location}. The nine were held, ' +
          'or held as far as they would go. The alignment is maintained.',
        changes: [
          {
            id: 'ts_prayer_change',
            kind: 'reputation_tally',
            title: 'Evening Count',
            detail:
              'The Temple tracks attendance at the count. Not as discipline — ' +
              'as weight record. Who shows up, how many they hold.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What did the count surface?',
        reactions: [
          {
            id: 'ts_prayer_mark',
            label:
              'One sphere was notably harder to hold tonight. Worth noting.',
            intent:
              'The spheres that resist the evening count tell the practitioner ' +
              'something about their current alignment. {name} records the difficulty.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'reputation_note',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY * 0.5,
                label:
                  '{name} attended the evening count at {location} — alignment observed',
              },
              { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ts_prayer_tally',
            label: 'The count is logged. The Temple notes the attendance.',
            intent:
              'Consistent attendance at the count is the foundation of sphere work. ' +
              'The Temple weights it accordingly.',
            effects: [
              { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
              { kind: 'reputation_tally', key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'ts.social.alms_giving',
    name: 'Alms Giving',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'heart',
    crudType: 'update',
    scale: 'personal',
    locationSubtypes: ['town', 'city', 'capital', 'shrine'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TS_DIFFICULTY_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          tierPromotionEligible: false,
        },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The Temple teaches that a gift without alignment carries no mote — it is ' +
          'material without passage. {name} weighs the gift at {location}' +
          '{?has_faction} by the Temple\'s measure — which sphere the giving honors, ' +
          'which sphere the receiving party most needs, whether these are compatible{/has_faction}. ' +
          '{?has_artifact}The {artifact:any} shifts the weight of the giving — ' +
          'a sphere-aligned object given as alms moves the recipient\'s alignment ' +
          'more than coin alone.{/has_artifact}',
        successAfterimage:
          'The gift is weighed and given in the correct orbit. ' +
          'The receiving party\'s alignment shifts, slightly. This is what the Temple ' +
          'counts as a gift: a passage opened, not just a hand filled.',
        failureAfterimage:
          'The gift is given but the orbit is off — the material reaches, but the ' +
          'passage does not open. The Temple notes: the coin was given. ' +
          'The alignment was not moved.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is giving alms at {location} — not coin alone, but coin given in the ' +
        'correct orbit, so the passage opens rather than just the hand.',
      success:
        'The gift opened the passage. The receiving party\'s alignment shifted slightly. ' +
        'The Temple counts this as a gift.',
      failure:
        'The coin was given. The alignment did not move. The Temple noted it.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} gave alms at {location} in the Temple\'s manner — weighed for ' +
          'sphere-alignment, not just material sufficiency.',
        changes: [
          {
            id: 'ts_alms_change',
            kind: 'reputation_tally',
            title: 'Alms Given',
            detail:
              'A gift given in the correct orbit changes the receiver\'s sphere-weight ' +
              'in a small but measurable way. The Temple counts these.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the giving open?',
        reactions: [
          {
            id: 'ts_alms_seed',
            label:
              'The person who received the aligned gift wants to understand the ' +
              'sphere-weight behind it.',
            intent:
              'A gift given with obvious sphere-alignment prompts curiosity in the ' +
              'receiver. They will want to know more about what was done and why.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'ts.social.theological_debate',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS,
                seedLabel:
                  'The alms recipient at {location} wants to discuss the sphere-weight ' +
                  'behind the gift',
              },
              { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ts_alms_tally',
            label: 'The giving is logged. The Temple\'s record of aligned gifts grows.',
            intent:
              'Consistent sphere-aligned giving is the Temple\'s outward face. ' +
              'The record accumulates.',
            effects: [
              { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
              { kind: 'reputation_tally', key: 'gold.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'ts.social.theological_debate',
    name: 'Theological Debate',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'star',
    crudType: 'update',
    scale: 'personal',
    locationSubtypes: ['city', 'capital', 'temple', 'tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: TS_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The Temple\'s debates begin with each speaker naming their current ' +
          'alignment — which sphere is loudest in them today, which is quietest. ' +
          'This is not a weakness to confess. It is the entering weight. ' +
          '{name} name{s} {their} alignment before the discussion begins.' +
          '{?has_ally}{ally:strongest} is present and has named theirs already — ' +
          '{name} adjusts the entering weight slightly to account for what {ally:strongest} ' +
          'brought into the room.{/has_ally}',
        successAfterimage:
          '{name} name{s} the alignment honestly and precisely. The other participants ' +
          'note it. The debate proceeds with all weights visible — which is how the ' +
          'Temple believes argument should work.',
        failureAfterimage:
          '{name} name{s} an alignment that the other participants do not observe. ' +
          'The Temple gently asks for a second reading — a misnamed entering weight ' +
          'corrupts the whole argument.',
      },
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: (TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          tierPromotionEligible: false,
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{?has_faction}The Temple\'s debates resolve nothing — the nine are in ' +
          'permanent argument. The point is the quality of the argument, ' +
          'not its conclusion.{/has_faction}' +
          '{?no_faction}The Temple\'s view: an argument about sphere ethics that ' +
          'resolves cleanly was not a real argument. The nine do not resolve. ' +
          'They are held.{/no_faction} ' +
          '{name} argue{s} from the entering weight, which means arguing ' +
          'from what {they} actually carry{s} today.',
        successAfterimage:
          'The argument is well-weighted — it favors one sphere without ' +
          'dismissing the others, which is as much as good argument can do. ' +
          'The debate closes with the alignment of those present shifted ' +
          'slightly toward the open.',
        failureAfterimage:
          'The argument overweights one sphere at the expense of the others. ' +
          'The Temple notes: that is a position, not yet a weight. A position ' +
          'can be held. A weight must be earned.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A theological debate at {location} — each participant names their entering ' +
        'alignment, then argues from it. The Temple\'s debates do not resolve. They adjust.',
      success:
        'The argument was well-weighted. The debate closed with the participants\' ' +
        'alignments shifted slightly toward the open.',
      failure:
        'The argument overweighted one sphere. The Temple said: that is a position, ' +
        'not yet a weight.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} participated in a theological debate at {location}. ' +
          'Entering alignments were named, the argument was made from the weight, ' +
          'and the room shifted slightly.',
        changes: [
          {
            id: 'ts_debate_change',
            kind: 'reputation_tally',
            title: 'Theological Record',
            detail:
              'The Temple records the entering alignment and the argument\'s quality. ' +
              'What position was argued, from which sphere, with what precision.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What did the debate leave behind?',
        reactions: [
          {
            id: 'ts_debate_mark',
            label:
              'The position argued here will be remembered. The Temple notes ' +
              'which sphere was favored.',
            intent:
              'An argument made with sphere-weight is a statement of alignment. ' +
              'The Temple notes what {name} argued for, from which sphere, ' +
              'and whether it was well-weighted or a position.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'reputation_note',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY * 0.5,
                label:
                  '{name} argued a theological position at {location} — sphere and quality recorded',
              },
              { kind: 'reputation_tally', key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ts_debate_tally',
            label:
              'The debate is logged. The quality of the argument is in the record.',
            intent:
              'The Temple values argument quality as much as sphere coverage. ' +
              'A well-weighted argument from any sphere advances the weight record.',
            effects: [
              { kind: 'reputation_tally', key: 'star.positive', delta: 1 },
              { kind: 'reputation_tally', key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Lifecycle Templates ──────────────────────────────────────────────────

export const TS_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'ts.join',
  name: 'Join the Temple of Spheres',
  rarityTier: 1,
  intrinsicTier: 'story_beat',
  reach: 'heart',
  crudType: 'create',
  scale: 'personal',
  locationSubtypes: ['shrine', 'temple', 'city', 'capital'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
  steps: [
    {
      reach: 'heart',
      duration: { min: 1, max: 2 },
      difficulty: TS_JOIN_DIFFICULTY / 100,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      successMetadata: { reputationDelta: 0.01 },
      failureMetadata: { reputationDelta: 0 },
      narrativeTemplate:
        '{name} presents at the Temple of Spheres at {location}. The welcoming rite ' +
        'requires the candidate to name which sphere they carry most heavily — not which ' +
        'sphere they wish they carried, which sphere they actually do. This is the ' +
        'first reading. The Temple compares it to what they observe.' +
        '{?has_faction}The receiving acolyte has done this a hundred times. ' +
        '{they} know{s} immediately whether the candidate is naming truly or naming ' +
        'aspirationally.{/has_faction}',
      successAfterimage:
        'The sphere is named. The Temple agrees with the reading — what {name} ' +
        'named and what the Temple observed are the same weight. ' +
        'The threshold is opened.',
      failureAfterimage:
        'The sphere named does not match what the Temple reads. The mismatch is ' +
        'not a failure — it is information. The Temple says: come back when the ' +
        'alignment is clearer to {them}. The work begins from honest weight.',
    },
    {
      reach: 'heart',
      duration: { min: 1, max: 1 },
      difficulty: (TS_JOIN_DIFFICULTY + TS_DIFFICULTY_STEP) / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        reputationDelta: 0.04,
        tierPromotionEligible: true,
      },
      failureMetadata: { reputationDelta: 0 },
      narrativeTemplate:
        'The entry rite is a full turning{?has_faction} — the Temple\'s way of ' +
        'confirming the candidate will not resist the orbit of the other eight{/has_faction}. ' +
        'The candidate holds all nine in sequence, lightest first. They will drop some. ' +
        'That is expected. What the Temple is reading is whether the dropping is resistance ' +
        'or simple unfamiliarity.',
      successAfterimage:
        'The turning holds at the expected weight. {name} leave{s} the entry rite ' +
        'with the alignment a little more true. ' +
        'The Temple does not praise this. The Temple notices it.',
      failureAfterimage:
        'The turning resists at one sphere — not refusal, but strong unfamiliarity. ' +
        'The Temple accepts this and marks the sphere in {name}\'s record. ' +
        'The acolyte work begins there.',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name} is presenting at the Temple of Spheres at {location} to join. ' +
      'The entry rite requires naming the sphere they carry most heavily ' +
      'and demonstrating they will not resist the other eight.',
    success:
      '{name} has joined the Temple of Spheres. The entry rite held. ' +
      'The alignment is noted. The work begins.',
    failure:
      'The Temple asked {name} to return when the alignment is clearer to them. ' +
      'The door remains open.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        '{name} completed the entry rite at the Temple of Spheres at {location}. ' +
        'The sphere they carry most heavily is named and recorded. ' +
        'The orbit they resist is marked. The work begins.',
      changes: [
        {
          id: 'ts_join_change',
          kind: 'faction_reputation',
          title: 'Temple Membership',
          detail:
            'The Temple of Spheres now has {name} in its weight record. ' +
            'What {they} carry{s}, what {they} resist{s}, what {they} aspire{s} to — ' +
            'all of it matters to the Temple\'s understanding of the nine.',
          polarity: 'gain',
        },
      ],
      reactionPrompt: 'What does the entry record?',
      reactions: [
        {
          id: 'ts_join_mark',
          label:
            'The sphere named at entry is the starting point. The Temple will watch it.',
          intent:
            'A new acolyte\'s entry reading is a baseline. The Temple will compare ' +
            'every future reading against it to track how the orbit shifts over time.',
          effects: [
            {
              kind: 'hidden_mark',
              category: 'reputation_note',
              severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY * 0.5,
              label:
                '{name} joined the Temple of Spheres; entry sphere and resistance noted',
            },
            { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'ts_join_faction',
          label: 'The entry is complete. The Temple\'s records are updated.',
          intent:
            'Membership in the Temple of Spheres opens the full scope of acolyte work. ' +
            'The weight record begins now.',
          effects: [
            { kind: 'faction_reputation_gain', factionId: 'temple_of_spheres', amount: 0.1 } as const,
            { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
            { kind: 'reputation_tally', key: 'star.positive', delta: 1 },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const TS_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'ts.promotion',
  name: 'Promotion in the Temple of Spheres',
  rarityTier: 1,
  intrinsicTier: 'story_beat',
  reach: 'star',
  crudType: 'update',
  scale: 'personal',
  locationSubtypes: ['shrine', 'temple', 'city', 'capital'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
  steps: [
    {
      reach: 'star',
      duration: { min: 1, max: 2 },
      difficulty: TS_PROMOTION_DIFFICULTY / 100,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      successMetadata: { reputationDelta: 0.02 },
      failureMetadata: { reputationDelta: -0.01 },
      narrativeTemplate:
        'The Temple reviews {name}\'s orbit over the past passage — not knowledge, ' +
        'not deeds, but whether {their} alignment has shifted toward the open or the closed. ' +
        'The weight record is examined. The sphere {they} resisted at entry — has it ' +
        'moved? The sphere {they} carry most heavily — has it found more subordinate ' +
        'companions?{?has_faction} The high priest does not speak during the review. ' +
        '{they} read{s} the record and then read{s} {name} and compares the two.{/has_faction}',
      successAfterimage:
        'The orbit is assessed as more open than the previous passage — not dramatically, ' +
        'but measurably. The Temple confirms: the weight is increasing in the right ' +
        'direction. The review recommends promotion.',
      failureAfterimage:
        'One sphere has grown heavier than the others. The Temple asks {name} to address ' +
        'this before the promotion can proceed. Not a refusal — a direction. ' +
        'The sphere that grew heavier is named.',
    },
    {
      reach: 'star',
      duration: { min: 1, max: 1 },
      difficulty: (TS_PROMOTION_DIFFICULTY + TS_DIFFICULTY_STEP) / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        reputationDelta: 0.05,
        tierPromotionEligible: true,
      },
      failureMetadata: { reputationDelta: -0.01 },
      narrativeTemplate:
        'The new rank{?has_faction} within the Temple{/has_faction} carries the weight ' +
        'of those in lesser orbit — more passages to read, more alignments to track, ' +
        'more rites to attend at the correct hour. The acceptance rite confirms that ' +
        '{name} understand{s} this is weight added, not status conferred.',
      successAfterimage:
        'The responsibility is accepted without the weight increasing beyond what ' +
        '{name} can carry. The Temple notes this as a good sign. ' +
        'The Temple is always watching the nine.',
      failureAfterimage:
        'The weight of the new rank is felt immediately — heavier than expected. ' +
        'The Temple says: that is correct. It will feel lighter in a passage or two. ' +
        'This is what the new rank is.',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name}\'s orbit is being reviewed for promotion in the Temple of Spheres. ' +
      'Whether the alignment has shifted, whether the weight is increasing in the ' +
      'right direction, and whether the added weight of the new rank can be accepted.',
    success:
      '{name} is promoted. The weight of the new rank is accepted. ' +
      'The Temple watches the nine.',
    failure:
      'The review identified a sphere that grew too heavy. The Temple named it ' +
      'and sent {name} to address it before promotion can proceed.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        '{name}\'s orbit was reviewed and the new rank was accepted at {location}. ' +
        'The weight of greater responsibility has been taken on. ' +
        'The Temple is watching the nine.',
      changes: [
        {
          id: 'ts_promotion_change',
          kind: 'faction_reputation',
          title: 'Rank Advanced',
          detail:
            'The Temple of Spheres has promoted {name}. The weight record reflects ' +
            'the shift — what {they} carry{s} now, what {they} are responsible for.',
          polarity: 'gain',
        },
      ],
      reactionPrompt: 'What does the new rank open?',
      reactions: [
        {
          id: 'ts_promotion_mark',
          label:
            'The new rank was witnessed by the spheres. The weight is in the record.',
          intent:
            'A promotion in the Temple carries cosmological weight — the sphere that ' +
            'was previously heaviest will be tested by the new responsibilities. ' +
            'The Temple notes this.',
          effects: [
            {
              kind: 'hidden_mark',
              category: 'divine_favor',
              severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
              label:
                '{name} was promoted in the Temple of Spheres; new rank weight observed',
            },
            { kind: 'reputation_tally', key: 'star.positive', delta: 1 },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'ts_promotion_faction',
          label: 'The promotion is recorded. The Temple\'s weight map is updated.',
          intent:
            'A promoted practitioner changes the Temple\'s capability in this region. ' +
            'The faction record is updated accordingly.',
          effects: [
            { kind: 'faction_reputation_gain', factionId: 'temple_of_spheres', amount: 0.2 } as const,
            { kind: 'reputation_tally', key: 'star.positive', delta: 2 },
            { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const TS_LIFECYCLE_TEMPLATES: UnifiedActionTemplate[] = [TS_JOIN_TEMPLATE, TS_PROMOTION_TEMPLATE];

// ─── Full Export ──────────────────────────────────────────────────────────

export const ALL_TS_TEMPLATES: UnifiedActionTemplate[] = [
  ...TEMPLE_OF_SPHERES_ENCOUNTER_TEMPLATES,
  ...TEMPLE_OF_SPHERES_SENIOR_TEMPLATES,
  ...TEMPLE_OF_SPHERES_ELITE_TEMPLATES,
  ...TEMPLE_OF_SPHERES_SOCIAL_TEMPLATES,
  ...TS_LIFECYCLE_TEMPLATES,
];

export function getTempleOfSpheresEncounterById(id: string): UnifiedActionTemplate | undefined {
  return ALL_TS_TEMPLATES.find(t => t.id === id);
}
