/**
 * Temple of Spheres Encounter Content — unified format (THR-31 Phase 2h).
 *
 * Voice bible: mystic, layered, careful. The Temple holds all nine spheres and
 * weighs them against each other constantly. Measured — sphere-vocabulary used
 * directly but never ostentatiously. Weight and alignment are load-bearing words.
 * Load-bearing lexicon: nine, weight, alignment, turning, open sphere, closed sphere,
 * mote, orbit, passage. Never: god.
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { FactionEncounterMeta } from '../types/faction';
import {
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

  {
    id: 'ts.quest.tend_shrine',
    name: 'Tend the Shrine',
    locationSubtypes: ['shrine', 'temple', 'town', 'city', 'capital'],
    rarityTier: 1,
    difficulty: TS_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'ts.quest.tend_shrine.1',
        name: 'Open the Alignment',
        narrativeTemplate: 'The shrine at {location} has grown quiet — the offerings are stale, the arrangement off. {name} works to restore the correct weight.',
        reach: 'heart',
        difficulty: TS_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The weight is restored. The shrine sits in correct orbit again.',
        failureAfterimage: 'The alignment is better but not held. The mote of the dominant sphere is still tilted.',
      },
      {
        id: 'ts.quest.tend_shrine.2',
        name: 'Close the Rite',
        narrativeTemplate: '{?has_faction}The Temple{/has_faction} requires the closing rite: nine offerings, one for each sphere, with the heaviest offered last.',
        reach: 'heart',
        difficulty: (TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The rite closes with the weight held. The Temple does not praise this. The Temple notices it.',
        failureAfterimage: 'The rite holds, but not at the weight {name} intended. The Temple asks when {they} would like to come back.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'heart.positive', weight: 0.5 },
        { kind: 'reputation_tally', domain: 'star.positive', weight: 0.3 },
        { kind: 'recent_event', label: 'shrine_tended', delay: 0 },
      ],
    },
  },

  {
    id: 'ts.quest.heal_the_sick',
    name: 'Heal the Sick',
    locationSubtypes: ['town', 'city', 'capital', 'village'],
    rarityTier: 1,
    difficulty: TS_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'ts.quest.heal_the_sick.1',
        name: 'Read the Weight',
        narrativeTemplate: 'The sick at {location} carry a misalignment — one sphere too open, one too closed. {name} reads the weight before attempting passage.',
        reach: 'heart',
        difficulty: TS_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The dominant sphere is identified. The passage is mapped.',
        failureAfterimage: 'The weight is unclear — two spheres competing. {name} works from the safer one.',
      },
      {
        id: 'ts.quest.heal_the_sick.2',
        name: 'Turn the Alignment',
        narrativeTemplate: 'Healing is a slow turning{?has_faction} — the Temple has no fast passages{/has_faction}. The orbit must shift naturally or the mote displaces.',
        reach: 'heart',
        difficulty: (TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The alignment shifts. The sick person\'s weight finds orbit again. The Temple notes the passage.',
        failureAfterimage: 'The turning was too fast. The alignment holds at a compromise. The Temple says: that is sometimes what the passage allows.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'heart.positive', weight: 0.6 },
        { kind: 'recent_event', label: 'sick_healed', delay: 0 },
      ],
    },
  },

  {
    id: 'ts.quest.meditate_on_spheres',
    name: 'Meditate on the Spheres',
    locationSubtypes: ['shrine', 'temple', 'tower', 'wilderness'],
    rarityTier: 1,
    difficulty: TS_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'ts.quest.meditate_on_spheres.1',
        name: 'Find the Quiet Orbit',
        narrativeTemplate: '{name} seeks the quiet at {location} — where the nine are in least argument with each other. The Temple calls this the resting orbit.',
        reach: 'star',
        difficulty: TS_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The resting orbit is found. {name} holds it for the required passage. The alignment is better than before.',
        failureAfterimage: 'The nine are arguing tonight. {name} holds three and loses two. The Temple does not judge this — the orbit resists many hands.',
      },
      {
        id: 'ts.quest.meditate_on_spheres.2',
        name: 'Name What Was Noticed',
        narrativeTemplate: 'The Temple asks{?has_faction} — which sphere was loudest in the room?{/has_faction} Which alignment has shifted since last {name} was here?',
        reach: 'star',
        difficulty: (TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Named precisely. The Temple adds the observation to its weight record.',
        failureAfterimage: 'Named imprecisely. The Temple adds both possibilities and asks {name} to come back with a cleaner read.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'star.positive', weight: 0.6 },
        { kind: 'recent_event', label: 'meditation_completed', delay: 0 },
      ],
    },
  },

  {
    id: 'ts.quest.consecrate_ground',
    name: 'Consecrate the Ground',
    locationSubtypes: ['wilderness', 'ruins', 'town', 'village'],
    rarityTier: 1,
    difficulty: (TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP) / 100,
    steps: [
      {
        id: 'ts.quest.consecrate_ground.1',
        name: 'Weigh the Site',
        narrativeTemplate: 'The ground at {location} is being prepared for a shrine. {name} must weigh it first — which spheres are already present, which are absent.',
        reach: 'heart',
        difficulty: TS_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The site\'s natural alignment is read. The consecration can proceed with that weight in mind.',
        failureAfterimage: 'The site is louder than expected. One sphere is very open here — the consecration must account for it.',
      },
      {
        id: 'ts.quest.consecrate_ground.2',
        name: 'Open the Nine',
        narrativeTemplate: '{?has_faction}The Temple\'s rite{/has_faction} opens the ground to all nine in sequence — not equally, but in proportion to what the site will carry.',
        reach: 'heart',
        difficulty: (TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The ground holds the opening. The nine are in proportion. The shrine can be placed.',
        failureAfterimage: 'One sphere did not open. The consecration is partial — the site can hold a lesser shrine, not a full one.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'heart.positive', weight: 0.6 },
        { kind: 'reputation_tally', domain: 'star.positive', weight: 0.4 },
        { kind: 'recent_event', label: 'ground_consecrated', delay: 2 },
      ],
    },
  },

  {
    id: 'ts.quest.copy_scriptures',
    name: 'Copy the Scriptures',
    locationSubtypes: ['shrine', 'temple', 'tower', 'city'],
    rarityTier: 1,
    difficulty: TS_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'ts.quest.copy_scriptures.1',
        name: 'Read the Weight of the Text',
        narrativeTemplate: 'The scriptures carry the alignment of the scribe who first wrote them. {name} must read that weight before copying — the copy should carry the same.',
        reach: 'star',
        difficulty: TS_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The original alignment is felt. The copy will carry it.',
        failureAfterimage: 'The original alignment is unclear to {name}. The copy will be technically correct but spiritually approximate.',
      },
      {
        id: 'ts.quest.copy_scriptures.2',
        name: 'Copy With the Right Orbit',
        narrativeTemplate: 'The Temple at {location}{?has_faction} requires the copy for a new shrine{/has_faction}. Each passage must be written in the orbit of the sphere it addresses.',
        reach: 'star',
        difficulty: (TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The copy is clean and properly weighted. The Temple receives it without comment, which is approval.',
        failureAfterimage: 'One passage slipped orbit. The Temple will have a senior scribe correct the mote before use.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'star.positive', weight: 0.5 },
        { kind: 'recent_event', label: 'scriptures_copied', delay: 0 },
      ],
    },
  },
];

// ─── Senior Quest Templates ───────────────────────────────────────────────

export const TEMPLE_OF_SPHERES_SENIOR_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'ts.senior.sphere_communion',
    name: 'Sphere Communion',
    locationSubtypes: ['shrine', 'temple', 'tower', 'capital'],
    rarityTier: 1,
    difficulty: TS_SENIOR_BASE / 100,
    steps: [
      {
        id: 'ts.senior.sphere_communion.1',
        name: 'Enter the Alignment',
        narrativeTemplate: '{name} enters the ritual space at {location} already weighted — the Temple has been watching the alignment shift over the past passage.',
        reach: 'star',
        difficulty: TS_SENIOR_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The entry is clean. All nine are present in the room. The orbit is still.',
        failureAfterimage: 'Three spheres resist the entry. The communion will proceed, but with the weight on the open ones only.',
      },
      {
        id: 'ts.senior.sphere_communion.2',
        name: 'Hold the Weight',
        narrativeTemplate: 'The weight of all nine must be held simultaneously{?has_faction} — the Temple calls this the full turning{/has_faction}. Most practitioners manage six. Seven is distinguished.',
        reach: 'star',
        difficulty: (TS_SENIOR_BASE + TS_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Seven spheres held. The Temple does not say this is exceptional. The Temple asks what {name} noticed at seven.',
        failureAfterimage: 'Five held. The Temple says: that is still the majority. Come back when the other two feel closer.',
      },
      {
        id: 'ts.senior.sphere_communion.3',
        name: 'Report the Observation',
        narrativeTemplate: 'What was the heaviest sphere at the height of the communion? Which orbit was most resistant? The Temple\'s record needs the observation.',
        reach: 'star',
        difficulty: TS_SENIOR_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Reported precisely. The Temple adds it to the weight record. The observation will be useful in the next turning.',
        failureAfterimage: 'The observation is approximate. The Temple accepts it and notes the approximation.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'star.positive', weight: 0.8 },
        { kind: 'reputation_tally', domain: 'heart.positive', weight: 0.4 },
        { kind: 'recent_event', label: 'sphere_communion', delay: 4 },
      ],
    },
  },

  {
    id: 'ts.senior.banish_corruption',
    name: 'Banish the Corruption',
    locationSubtypes: ['ruins', 'dungeon', 'town', 'city'],
    rarityTier: 1,
    difficulty: TS_SENIOR_BASE / 100,
    steps: [
      {
        id: 'ts.senior.banish_corruption.1',
        name: 'Name the Closed Sphere',
        narrativeTemplate: 'The corruption at {location} is a closed sphere — one that should be open is sealed. {name} must identify which one before the weight can be addressed.',
        reach: 'star',
        difficulty: TS_SENIOR_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The closed sphere is named. The weight of the corruption makes sense now. The address can begin.',
        failureAfterimage: 'Two spheres are candidates. {name} proceeds on the more likely one, noting the uncertainty.',
      },
      {
        id: 'ts.senior.banish_corruption.2',
        name: 'Open What Was Closed',
        narrativeTemplate: '{?has_faction}The Temple teaches{/has_faction}: a closed sphere is not destroyed — it is held shut by weight on one side. Remove the weight and the sphere opens.',
        reach: 'star',
        difficulty: (TS_SENIOR_BASE + TS_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The sphere opens. The corruption dissolves as the orbit restores. The Temple notes the passage was clean.',
        failureAfterimage: 'The sphere opens partially. The corruption is reduced but not gone. The weight that held it is deeper than one passage can address.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'star.positive', weight: 0.7 },
        { kind: 'reputation_tally', domain: 'heart.positive', weight: 0.5 },
        { kind: 'hidden_mark', label: 'corruption_banished', severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY },
        { kind: 'recent_event', label: 'corruption_banished', delay: 3 },
      ],
    },
  },

  {
    id: 'ts.senior.craft_relic',
    name: 'Craft a Sphere Relic',
    locationSubtypes: ['temple', 'tower', 'capital'],
    rarityTier: 1,
    difficulty: (TS_SENIOR_BASE + TS_DIFFICULTY_STEP) / 100,
    steps: [
      {
        id: 'ts.senior.craft_relic.1',
        name: 'Choose the Dominant Sphere',
        narrativeTemplate: 'A relic carries the weight of one sphere most heavily. {name} must choose which the object will hold{?has_faction} — the Temple will judge whether the choice fits the purpose{/has_faction}.',
        reach: 'star',
        difficulty: TS_SENIOR_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The dominant sphere is chosen and the choice is ratified. The crafting begins with that weight in mind.',
        failureAfterimage: 'The choice is contested by the material itself — it wants a different weight. {name} proceeds against the grain.',
      },
      {
        id: 'ts.senior.craft_relic.2',
        name: 'Set the Orbit',
        narrativeTemplate: 'The object is set in the orbit of its dominant sphere. The remaining eight must be present but lighter — an alignment, not a balance.',
        reach: 'star',
        difficulty: (TS_SENIOR_BASE + TS_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The orbit is set and holds. The relic carries the intended alignment. The Temple receives it without comment, which is approval.',
        failureAfterimage: 'The orbit is approximate. The relic carries the weight, but not cleanly. The Temple will use it, noting the imprecision.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'star.positive', weight: 0.8 },
        { kind: 'encounter_seed', templateId: 'ts.senior.sphere_communion', delay: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS },
        { kind: 'recent_event', label: 'relic_crafted', delay: 4 },
      ],
    },
  },
];

// ─── Elite Quest Templates ────────────────────────────────────────────────

export const TEMPLE_OF_SPHERES_ELITE_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'ts.elite.sphere_convergence',
    name: 'Sphere Convergence',
    locationSubtypes: ['shrine', 'temple', 'capital', 'tower'],
    rarityTier: 1,
    difficulty: TS_ELITE_BASE / 100,
    steps: [
      {
        id: 'ts.elite.sphere_convergence.1',
        name: 'Prepare the Participants',
        narrativeTemplate: 'The convergence requires nine practitioners, one weighted to each sphere. {name} reads the alignment of those gathered at {location}.',
        reach: 'star',
        difficulty: TS_ELITE_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The nine weights are present. Each practitioner\'s sphere is confirmed. The convergence can proceed.',
        failureAfterimage: 'Two practitioners carry the same sphere-weight. The convergence will be asymmetric — possible, but heavier on one side.',
      },
      {
        id: 'ts.elite.sphere_convergence.2',
        name: 'Hold All Nine',
        narrativeTemplate: '{?has_faction}The Temple\'s pontifex{/has_faction} calls the turning: each sphere must be held simultaneously by its designated practitioner. The orbit must run clean.',
        reach: 'star',
        difficulty: (TS_ELITE_BASE + TS_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'All nine held. The orbit runs clean for the full passage. The Temple does not describe what this feels like. The Temple says: that was a convergence.',
        failureAfterimage: 'Seven held. Two dropped at the weight. The convergence produces a partial turning — significant but not complete.',
      },
      {
        id: 'ts.elite.sphere_convergence.3',
        name: 'Record the Alignment',
        narrativeTemplate: 'The convergence produces an alignment that must be recorded immediately — the weight will shift within hours. What the nine were. What passage was opened.',
        reach: 'star',
        difficulty: TS_ELITE_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Record made while the alignment held. The Temple adds it to the convergence annal — one of very few complete records.',
        failureAfterimage: 'Record made, but the weight had already begun to shift. The Temple notes the partial record with the time it was taken.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'star.positive', weight: 1.0 },
        { kind: 'reputation_tally', domain: 'heart.positive', weight: 0.5 },
        { kind: 'hidden_mark', label: 'convergence_participant', severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY },
        { kind: 'recent_event', label: 'sphere_convergence', delay: 7 },
      ],
    },
  },

  {
    id: 'ts.elite.found_cathedral',
    name: 'Found a Cathedral',
    locationSubtypes: ['city', 'capital', 'town'],
    rarityTier: 1,
    difficulty: (TS_ELITE_BASE + TS_DIFFICULTY_STEP) / 100,
    steps: [
      {
        id: 'ts.elite.found_cathedral.1',
        name: 'Choose the Ground',
        narrativeTemplate: 'A cathedral at {location} must sit on ground that will hold all nine without argument. {name} surveys the possible sites for natural alignment.',
        reach: 'heart',
        difficulty: TS_ELITE_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The right ground is found. The site carries a resting orbit — no sphere is fighting for dominance here.',
        failureAfterimage: 'All available ground is weighted toward one or two spheres. The cathedral will be built with that imbalance acknowledged.',
      },
      {
        id: 'ts.elite.found_cathedral.2',
        name: 'Consecrate at Full Weight',
        narrativeTemplate: '{?has_faction}The Temple\'s founding rite{/has_faction} requires the full nine consecrations, each performed at the hour of its sphere\'s highest passage.',
        reach: 'heart',
        difficulty: (TS_ELITE_BASE + TS_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'All nine consecrations completed at the correct hour. The cathedral is founded with full alignment.',
        failureAfterimage: 'One consecration fell outside the passage window. The cathedral is founded with eight of nine — the ninth will be attempted at the next turning.',
      },
      {
        id: 'ts.elite.found_cathedral.3',
        name: 'Open the First Rite',
        narrativeTemplate: 'The first public rite in a new cathedral is the founding record. What the alignment was. What the passage produced. What the nine were at the moment the doors opened.',
        reach: 'heart',
        difficulty: TS_ELITE_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The rite closes with the weight held. The cathedral is open. The Temple records the founding alignment — {name}\'s weight among the nine.',
        failureAfterimage: 'The rite holds, but the weight slips at the close. The cathedral is open. The Temple notes the imprecision in the founding record, gently.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'heart.positive', weight: 0.9 },
        { kind: 'reputation_tally', domain: 'star.positive', weight: 0.7 },
        { kind: 'encounter_seed', templateId: 'ts.elite.sphere_convergence', delay: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS * 2 },
        { kind: 'recent_event', label: 'cathedral_founded', delay: 8 },
      ],
    },
  },
];

// ─── Social Templates ─────────────────────────────────────────────────────

export const TEMPLE_OF_SPHERES_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'ts.social.evening_prayer',
    name: 'Evening Prayer',
    locationSubtypes: ['shrine', 'temple', 'town', 'city', 'capital'],
    rarityTier: 1,
    difficulty: TS_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'ts.social.evening_prayer.1',
        name: 'Join the Turning',
        narrativeTemplate: 'The evening prayer at {location} opens{?has_faction} with the Temple\'s traditional nine-count{/has_faction} — one breath for each sphere, lightest first. {name} joins the orbit.',
        reach: 'heart',
        difficulty: TS_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: '{name} holds the orbit through all nine. The alignment is a little more true leaving than arriving.',
        failureAfterimage: '{name} loses the count at six. The Temple does not say anything. Six is still the majority.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'heart.positive', weight: 0.3 },
        { kind: 'recent_event', label: 'evening_prayer', delay: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS },
      ],
    },
  },

  {
    id: 'ts.social.alms_giving',
    name: 'Alms Giving',
    locationSubtypes: ['town', 'city', 'capital', 'shrine'],
    rarityTier: 1,
    difficulty: TS_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'ts.social.alms_giving.1',
        name: 'Weigh the Gift',
        narrativeTemplate: 'The Temple teaches that a gift without alignment carries no mote — it is material without passage. {name} weighs the gift at {location}{?has_faction} by the Temple\'s measure{/has_faction}.',
        reach: 'heart',
        difficulty: TS_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The gift is weighed and given in the correct orbit. The receiving party\'s alignment shifts, slightly.',
        failureAfterimage: 'The gift is given but the orbit is off. The Temple notes: the material reaches, but the passage does not open.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'heart.positive', weight: 0.3 },
        { kind: 'reputation_tally', domain: 'gold.positive', weight: 0.2 },
        { kind: 'recent_event', label: 'alms_given', delay: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS },
      ],
    },
  },

  {
    id: 'ts.social.theological_debate',
    name: 'Theological Debate',
    locationSubtypes: ['city', 'capital', 'temple', 'tower'],
    rarityTier: 1,
    difficulty: TS_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'ts.social.theological_debate.1',
        name: 'Name Your Alignment',
        narrativeTemplate: 'The Temple\'s debates begin with each speaker naming their current alignment — which sphere is loudest, which is quietest. This is not a weakness. This is the entering weight.',
        reach: 'star',
        difficulty: TS_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: '{name} names the alignment honestly. The debate proceeds with all weights visible.',
        failureAfterimage: '{name} names an alignment that the other participants do not observe. The Temple gently asks for a second reading.',
      },
      {
        id: 'ts.social.theological_debate.2',
        name: 'Argue From the Weight',
        narrativeTemplate: '{?has_faction}The Temple\'s debates resolve nothing{/has_faction} — the nine are in permanent argument. The point is the quality of the argument, not its conclusion.',
        reach: 'star',
        difficulty: (TS_DIFFICULTY_BASE + TS_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The argument is well-weighted. The debate closes with the alignment of those present shifted slightly toward the open.',
        failureAfterimage: 'The argument overweights one sphere at the expense of the others. The Temple notes: that is a position, not yet a weight.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'star.positive', weight: 0.4 },
        { kind: 'recent_event', label: 'theological_debate', delay: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS },
      ],
    },
  },
];

// ─── Lifecycle Templates ──────────────────────────────────────────────────

export const TS_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'ts.join',
  name: 'Join the Temple of Spheres',
  locationSubtypes: ['shrine', 'temple', 'city', 'capital'],
  rarityTier: 1,
  difficulty: TS_JOIN_DIFFICULTY / 100,
  steps: [
    {
      id: 'ts.join.1',
      name: 'Present at the Threshold',
      narrativeTemplate: '{name} presents at the Temple of Spheres at {location}. The welcoming rite requires the candidate to name which sphere they carry most heavily.',
      reach: 'heart',
      difficulty: TS_JOIN_DIFFICULTY / 100,
      duration: { min: 1, max: 2 },
      failBehavior: 'block',
      onSuccess: [],
      onFailure: [],
      successAfterimage: 'The sphere is named. The Temple agrees with the reading. The threshold is opened.',
      failureAfterimage: 'The sphere named does not match what the Temple reads. The Temple says: come back when the alignment is clearer — to {them}.',
    },
    {
      id: 'ts.join.2',
      name: 'Accept the Turning',
      narrativeTemplate: 'The entry rite is a full turning{?has_faction} — the Temple\'s way of confirming the candidate will not resist the orbit of the other eight{/has_faction}.',
      reach: 'heart',
      difficulty: (TS_JOIN_DIFFICULTY + TS_DIFFICULTY_STEP) / 100,
      duration: { min: 1, max: 1 },
      failBehavior: 'block',
      onSuccess: [],
      onFailure: [],
      successAfterimage: 'The turning holds. {name} leaves the entry rite with the alignment a little more true. The Temple does not praise this. The Temple notices it.',
      failureAfterimage: 'The turning resists at one sphere. The Temple accepts this and marks the sphere in {name}\'s record — the work begins there.',
    },
  ],
  aftermathConfig: {
    reactions: [
      { kind: 'faction_reputation_gain', factionDefId: 'temple_of_spheres', amount: 0.1 },
      { kind: 'recent_event', label: 'joined_temple_of_spheres', delay: 0 },
    ],
  },
};

export const TS_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'ts.promotion',
  name: 'Promotion in the Temple of Spheres',
  locationSubtypes: ['shrine', 'temple', 'city', 'capital'],
  rarityTier: 1,
  difficulty: TS_PROMOTION_DIFFICULTY / 100,
  steps: [
    {
      id: 'ts.promotion.1',
      name: 'The Weight Review',
      narrativeTemplate: 'The Temple reviews {name}\'s orbit over the past passage — not their knowledge, but whether their alignment has shifted toward the open or the closed.',
      reach: 'star',
      difficulty: TS_PROMOTION_DIFFICULTY / 100,
      duration: { min: 1, max: 2 },
      failBehavior: 'block',
      onSuccess: [],
      onFailure: [],
      successAfterimage: 'The orbit is assessed as more open than the previous passage. The Temple confirms: the weight is increasing in the right direction.',
      failureAfterimage: 'One sphere has grown heavier than the others. The Temple asks {name} to address this before the promotion can proceed.',
    },
    {
      id: 'ts.promotion.2',
      name: 'Accept Greater Responsibility',
      narrativeTemplate: 'The new rank{?has_faction} within the Temple{/has_faction} carries the weight of those in lesser orbit. More passages to attend. More alignments to read.',
      reach: 'star',
      difficulty: (TS_PROMOTION_DIFFICULTY + TS_DIFFICULTY_STEP) / 100,
      duration: { min: 1, max: 1 },
      failBehavior: 'block',
      onSuccess: [],
      onFailure: [],
      successAfterimage: 'The responsibility is accepted without the weight increasing. The Temple notes this as a good sign. The Temple is always watching the nine.',
      failureAfterimage: 'The weight of the new rank is felt immediately. The Temple says: that is correct. It will feel lighter in a passage or two.',
    },
  ],
  aftermathConfig: {
    reactions: [
      { kind: 'faction_reputation_gain', factionDefId: 'temple_of_spheres', amount: 0.2 },
      { kind: 'recent_event', label: 'temple_promotion', delay: 1 },
    ],
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

