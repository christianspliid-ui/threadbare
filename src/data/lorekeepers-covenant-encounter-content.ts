/**
 * Lorekeepers Covenant Encounter Content — unified format (THR-31 Phase 2g).
 *
 * Voice bible: quiet, precise, patient. The Covenant knows the world forgets and
 * considers that a personal affront. Scholarly without obsession — warm where the
 * Arcane Circle is cold; the Covenant loves what it keeps.
 * Load-bearing lexicon: record, annal, entry, margin, hand, date, what was said,
 * what was not said, what is remembered. Never: story, myth.
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { FactionEncounterMeta } from '../types/faction';
import {
  FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS,
  FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
} from './faction-constants';

// ─── Constants ───────────────────────────────────────────────────────────

const LK_DIFFICULTY_BASE = 25;
const LK_DIFFICULTY_STEP = 10;
const LK_SENIOR_BASE = 40;
const LK_ELITE_BASE = 55;
const LK_JOIN_DIFFICULTY = 20;
const LK_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const LOREKEEPERS_COVENANT_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  ['lk.join', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.0, questType: 'standard' }],
  ['lk.promotion', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.0, questType: 'standard' }],
  ['lk.quest.catalogue_ruins', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.04, questType: 'standard' }],
  ['lk.quest.translate_text', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.04, questType: 'standard' }],
  ['lk.quest.recover_tome', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.04, questType: 'standard' }],
  ['lk.quest.map_ley_lines', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.05, questType: 'standard' }],
  ['lk.quest.interview_elder', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.05, questType: 'standard' }],
  ['lk.senior.decipher_prophecy', { factionDefId: 'lorekeepers_covenant', minRank: 'scholar', reputationReward: 0.06, questType: 'senior' }],
  ['lk.senior.excavate_archive', { factionDefId: 'lorekeepers_covenant', minRank: 'scholar', reputationReward: 0.06, questType: 'senior' }],
  ['lk.senior.compose_treatise', { factionDefId: 'lorekeepers_covenant', minRank: 'scholar', reputationReward: 0.06, questType: 'senior' }],
  ['lk.elite.forbidden_library', { factionDefId: 'lorekeepers_covenant', minRank: 'sage', reputationReward: 0.08, questType: 'elite' }],
  ['lk.elite.cosmic_revelation', { factionDefId: 'lorekeepers_covenant', minRank: 'sage', reputationReward: 0.08, questType: 'elite' }],
  ['lk.social.lecture_hall', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.02, questType: 'standard' }],
  ['lk.social.debate_forum', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.02, questType: 'standard' }],
  ['lk.social.manuscript_exchange', { factionDefId: 'lorekeepers_covenant', minRank: 'scribe', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Standard Quest Templates ─────────────────────────────────────────────

export const LOREKEEPERS_COVENANT_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'lk.quest.catalogue_ruins',
    name: 'Catalogue the Ruins',
    locationSubtypes: ['ruins', 'city', 'capital', 'tower'],
    rarityTier: 1,
    difficulty: LK_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'lk.quest.catalogue_ruins.1',
        name: 'Survey the Site',
        narrativeTemplate: 'A newly uncovered site at {location} has no entry in the Covenant\'s annal. {name} is sent to open the record.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The site is surveyed. The first entry is made. The margin notes the date.',
        failureAfterimage: 'The site is unstable. The first entry is incomplete. The date is recorded with a question mark.',
      },
      {
        id: 'lk.quest.catalogue_ruins.2',
        name: 'Record What Was Found',
        narrativeTemplate: '{?has_faction}The Covenant archivist{/has_faction} at the Covenant records what was said at the site and, more carefully, what was not said.',
        reach: 'eye',
        difficulty: (LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The record is complete. The margin is clean. What is remembered will be remembered correctly.',
        failureAfterimage: 'A gap in the record. The Covenant will reconstruct it from other hands. For one generation, something will be remembered slightly wrong.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'eye.positive', weight: 0.6 },
        { kind: 'recent_event', label: 'ruins_catalogued', delay: 0 },
      ],
    },
  },

  {
    id: 'lk.quest.translate_text',
    name: 'Translate the Text',
    locationSubtypes: ['tower', 'city', 'capital', 'library'],
    rarityTier: 1,
    difficulty: LK_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'lk.quest.translate_text.1',
        name: 'Read the Hand',
        narrativeTemplate: 'The document arrived at {location} with no provenance. {name} reads the hand carefully — what was written and, between the lines, what was not said.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The hand is identified. The date is estimated. The record opens.',
        failureAfterimage: 'The hand is unknown. The date cannot be fixed. The margin stays blank.',
      },
      {
        id: 'lk.quest.translate_text.2',
        name: 'Render the Entry',
        narrativeTemplate: '{?has_faction}The Covenant{/has_faction} requires the translation in the second hand — precise, without the translator\'s opinion in the margins.',
        reach: 'eye',
        difficulty: (LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Entry rendered. The annal grows by one. What is remembered will be remembered correctly.',
        failureAfterimage: 'Opinion crept in. The Covenant\'s senior archivist will re-render it. {name}\'s translation goes in the appendix.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'eye.positive', weight: 0.5 },
        { kind: 'reputation_tally', domain: 'star.positive', weight: 0.2 },
        { kind: 'recent_event', label: 'text_translated', delay: 0 },
      ],
    },
  },

  {
    id: 'lk.quest.recover_tome',
    name: 'Recover a Missing Tome',
    locationSubtypes: ['ruins', 'city', 'capital', 'tower', 'dungeon'],
    rarityTier: 1,
    difficulty: (LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP) / 100,
    steps: [
      {
        id: 'lk.quest.recover_tome.1',
        name: 'Find What Is Missing',
        narrativeTemplate: 'An entry in the annal references a volume not in the Covenant\'s vaults. {name} traces the last recorded hand at {location}.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The volume\'s last known location is identified. The record confirms it exists.',
        failureAfterimage: 'The trail goes cold. The last entry in the margin is two centuries back.',
      },
      {
        id: 'lk.quest.recover_tome.2',
        name: 'Return It to the Record',
        narrativeTemplate: 'The tome must be returned{?has_faction} to the Covenant{/has_faction} undamaged. A torn page is a small hole the world falls into later.',
        reach: 'eye',
        difficulty: (LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Volume returned. Condition noted. The record updates. The hole closes.',
        failureAfterimage: 'Damage to the binding. The Covenant catalogues the loss precisely before attempting repair.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'eye.positive', weight: 0.7 },
        { kind: 'hidden_mark', label: 'lore_recovery', severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY },
        { kind: 'recent_event', label: 'tome_recovered', delay: 2 },
      ],
    },
  },

  {
    id: 'lk.quest.map_ley_lines',
    name: 'Map the Ley Lines',
    locationSubtypes: ['wilderness', 'ruins', 'town', 'city'],
    rarityTier: 1,
    difficulty: (LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP) / 100,
    steps: [
      {
        id: 'lk.quest.map_ley_lines.1',
        name: 'Walk the Lines',
        narrativeTemplate: 'The Covenant\'s annal has entries describing lines of resonance near {location} that have never been formally recorded. {name} is sent to make the entry.',
        reach: 'eye',
        difficulty: (LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The lines are walked and marked. The date is fixed. The margin is clean.',
        failureAfterimage: 'The resonance is faint. The entry is made with uncertainty noted. The Covenant will send someone again next generation.',
      },
      {
        id: 'lk.quest.map_ley_lines.2',
        name: 'File the Survey',
        narrativeTemplate: '{name} files the survey{?has_faction} with the Covenant archivists{/has_faction}. The margin receives the date and the hand that walked it.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Survey filed. The record keeps. What is remembered of the lines will be remembered correctly now.',
        failureAfterimage: 'Contradictions with earlier entries. The Covenant will hold both accounts and note the discrepancy.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'eye.positive', weight: 0.6 },
        { kind: 'reputation_tally', domain: 'star.positive', weight: 0.3 },
        { kind: 'recent_event', label: 'ley_lines_mapped', delay: 1 },
      ],
    },
  },

  {
    id: 'lk.quest.interview_elder',
    name: 'Interview an Elder',
    locationSubtypes: ['town', 'city', 'capital', 'village'],
    rarityTier: 1,
    difficulty: LK_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'lk.quest.interview_elder.1',
        name: 'Open the Account',
        narrativeTemplate: 'The elder at {location} has lived through an event the Covenant has no entry for. {name} must take what was said — and note what was not said.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The elder speaks. {name} records every word and leaves space in the margin for what was held back.',
        failureAfterimage: 'The elder is reluctant. The account is partial. The margin notes the reluctance.',
      },
      {
        id: 'lk.quest.interview_elder.2',
        name: 'Cross-Reference',
        narrativeTemplate: '{?has_faction}The Covenant\'s archivists{/has_faction} check the new account against the existing annal. Contradictions between accounts are never resolved by erasure.',
        reach: 'eye',
        difficulty: (LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The account fits. The entry is made under the correct date. What is remembered is a little more exact.',
        failureAfterimage: 'A date does not land where it should. The Covenant opens a second entry to hold both accounts.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'eye.positive', weight: 0.5 },
        { kind: 'recent_event', label: 'elder_interviewed', delay: 0 },
      ],
    },
  },
];

// ─── Senior Quest Templates ───────────────────────────────────────────────

export const LOREKEEPERS_SENIOR_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'lk.senior.decipher_prophecy',
    name: 'Decipher a Prophecy',
    locationSubtypes: ['tower', 'city', 'capital', 'ruins'],
    rarityTier: 1,
    difficulty: LK_SENIOR_BASE / 100,
    steps: [
      {
        id: 'lk.senior.decipher_prophecy.1',
        name: 'Establish the Text',
        narrativeTemplate: 'The document arrived at {location} with two competing transcriptions. {name} must establish which hand is primary before the decipherment can begin.',
        reach: 'eye',
        difficulty: LK_SENIOR_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Primary hand confirmed. The record establishes which text will serve as the entry.',
        failureAfterimage: 'The hands cannot be ordered with certainty. Both are entered, each with their uncertainties noted.',
      },
      {
        id: 'lk.senior.decipher_prophecy.2',
        name: 'Open the Entry',
        narrativeTemplate: '{?has_faction}The senior archivist of the Covenant{/has_faction} requires the entry to distinguish what was said from what was later remembered to have been said.',
        reach: 'eye',
        difficulty: (LK_SENIOR_BASE + LK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Entry made. The distinction holds. The Covenant\'s record is precise on what was known and when.',
        failureAfterimage: 'The layers conflate. The entry is flagged. A future hand will need to unsort it.',
      },
      {
        id: 'lk.senior.decipher_prophecy.3',
        name: 'Record the Implication',
        narrativeTemplate: 'The Covenant records the implication in the margin — not as prophecy, but as what the record suggests when the date is correct.',
        reach: 'eye',
        difficulty: LK_SENIOR_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: '{name} signs the margin in the Covenant\'s second hand. What is remembered will be remembered correctly.',
        failureAfterimage: 'The margin note is imprecise. The senior archivist will revise it in the next session.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'eye.positive', weight: 0.8 },
        { kind: 'reputation_tally', domain: 'star.positive', weight: 0.4 },
        { kind: 'recent_event', label: 'prophecy_deciphered', delay: 4 },
      ],
    },
  },

  {
    id: 'lk.senior.excavate_archive',
    name: 'Excavate a Lost Archive',
    locationSubtypes: ['ruins', 'dungeon', 'tower'],
    rarityTier: 1,
    difficulty: LK_SENIOR_BASE / 100,
    steps: [
      {
        id: 'lk.senior.excavate_archive.1',
        name: 'Locate the Vaults',
        narrativeTemplate: 'The annal places a pre-Collapse archive below {location}. {name} leads the survey team. The Covenant wants entries, not artifacts.',
        reach: 'eye',
        difficulty: LK_SENIOR_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The vault entrance is confirmed. The date and hand of the original sealing is recovered from the lintel inscription.',
        failureAfterimage: 'The vault is collapsed. Some entries will be recovered. The Covenant is patient.',
      },
      {
        id: 'lk.senior.excavate_archive.2',
        name: 'Record Before Removal',
        narrativeTemplate: '{?has_faction}Covenant protocol{/has_faction} requires the location and condition of every document recorded before anything is moved. A page torn in transit is a hole.',
        reach: 'eye',
        difficulty: (LK_SENIOR_BASE + LK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Complete site record. Every entry catalogued in situ. The removal proceeds with no holes.',
        failureAfterimage: 'Pressure from the site\'s instability — some entries made under duress. The margins carry the uncertainty.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'eye.positive', weight: 0.8 },
        { kind: 'encounter_seed', templateId: 'lk.senior.compose_treatise', delay: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS },
        { kind: 'recent_event', label: 'archive_excavated', delay: 5 },
      ],
    },
  },

  {
    id: 'lk.senior.compose_treatise',
    name: 'Compose a Treatise',
    locationSubtypes: ['tower', 'city', 'capital'],
    rarityTier: 1,
    difficulty: LK_SENIOR_BASE / 100,
    steps: [
      {
        id: 'lk.senior.compose_treatise.1',
        name: 'Gather the Entries',
        narrativeTemplate: '{name} assembles every relevant entry in the Covenant\'s annal covering {location}. What was said. What was not said. What is remembered.',
        reach: 'eye',
        difficulty: LK_SENIOR_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Entries gathered. Contradictions between accounts are all noted, not resolved.',
        failureAfterimage: 'Two entries cannot be located. The treatise will carry a note: record incomplete.',
      },
      {
        id: 'lk.senior.compose_treatise.2',
        name: 'Write the Margin Commentary',
        narrativeTemplate: '{?has_faction}The Covenant\'s senior archivist{/has_faction} will review the commentary for opinion. The commentary may describe but not argue.',
        reach: 'eye',
        difficulty: (LK_SENIOR_BASE + LK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Commentary clean. The treatise goes to the annals. {name} signs the margin in the second hand.',
        failureAfterimage: 'Opinion in the margin. The senior archivist sets a pen to it. The revision is not unkind — just exact.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'eye.positive', weight: 0.7 },
        { kind: 'reputation_tally', domain: 'star.positive', weight: 0.3 },
        { kind: 'recent_event', label: 'treatise_composed', delay: 3 },
      ],
    },
  },
];

// ─── Elite Quest Templates ────────────────────────────────────────────────

export const LOREKEEPERS_ELITE_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'lk.elite.forbidden_library',
    name: 'Access the Forbidden Library',
    locationSubtypes: ['ruins', 'tower', 'dungeon', 'capital'],
    rarityTier: 1,
    difficulty: LK_ELITE_BASE / 100,
    steps: [
      {
        id: 'lk.elite.forbidden_library.1',
        name: 'Establish Access Rights',
        narrativeTemplate: 'The library at {location} holds entries the Covenant has no duplicate of. The access question is not moral — it is procedural. {name} negotiates the record.',
        reach: 'eye',
        difficulty: LK_ELITE_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Access established. The Covenant\'s interest in the record — not the collection — is accepted.',
        failureAfterimage: 'Access denied. The Covenant notes the denial in the annal with the date and the name of who held the door.',
      },
      {
        id: 'lk.elite.forbidden_library.2',
        name: 'Record What Is There',
        narrativeTemplate: 'Time is short{?has_faction} — the Covenant expects {name} to record entries, not acquire volumes{/has_faction}. What was said on each page. What was not said in any margin.',
        reach: 'eye',
        difficulty: (LK_ELITE_BASE + LK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The record is taken. The library\'s entries enter the Covenant\'s annal for the first time. What is remembered grows.',
        failureAfterimage: 'Incomplete record. The window closed before the final entries. The Covenant will try again — in another generation, with a different hand.',
      },
      {
        id: 'lk.elite.forbidden_library.3',
        name: 'Bring the Record Home',
        narrativeTemplate: 'The record is useless in the field. It must reach the Covenant\'s vaults, where it can be dated and entered properly.',
        reach: 'eye',
        difficulty: LK_ELITE_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Record delivered. The vault opens a new section. {name}\'s hand is in the margin on every page.',
        failureAfterimage: 'Partial delivery. Three entries were lost in transit. The Covenant notes the holes — a small record of what cannot now be remembered.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'eye.positive', weight: 1.0 },
        { kind: 'hidden_mark', label: 'forbidden_lore', severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY },
        { kind: 'recent_event', label: 'forbidden_library_accessed', delay: 6 },
      ],
    },
  },

  {
    id: 'lk.elite.cosmic_revelation',
    name: 'Cosmic Revelation',
    locationSubtypes: ['ruins', 'tower', 'capital', 'observatory'],
    rarityTier: 1,
    difficulty: (LK_ELITE_BASE + LK_DIFFICULTY_STEP) / 100,
    steps: [
      {
        id: 'lk.elite.cosmic_revelation.1',
        name: 'Find the Contradicting Date',
        narrativeTemplate: 'An entry in the oldest section of the annal contains a date that does not land where it should. {name} is sent to {location} to find what that date refers to.',
        reach: 'eye',
        difficulty: LK_ELITE_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The date refers to something not in any other record. {name} opens a new entry: the first account.',
        failureAfterimage: 'The date\'s referent is still unclear. The Covenant files {name}\'s working notes in the appendix.',
      },
      {
        id: 'lk.elite.cosmic_revelation.2',
        name: 'Record What Cannot Be Understood Yet',
        narrativeTemplate: '{?has_faction}The Covenant\'s doctrine{/has_faction}: a record unkept because the recorder did not understand it is a hole. Record what was observed. Let a later hand supply the meaning.',
        reach: 'eye',
        difficulty: (LK_ELITE_BASE + LK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The observation is entered precisely, without interpretation. The margin notes the date and the hand. What is remembered waits for what will one day be understood.',
        failureAfterimage: 'Interpretation crept in. The entry is made, but the senior archivist removes {name}\'s conclusion, leaving the observation intact.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'eye.positive', weight: 0.9 },
        { kind: 'reputation_tally', domain: 'star.positive', weight: 0.5 },
        { kind: 'hidden_mark', label: 'cosmic_record', severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY },
        { kind: 'recent_event', label: 'cosmic_revelation_recorded', delay: 7 },
      ],
    },
  },
];

// ─── Social Templates ─────────────────────────────────────────────────────

export const LOREKEEPERS_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'lk.social.lecture_hall',
    name: 'Lecture Hall',
    locationSubtypes: ['city', 'capital', 'tower'],
    rarityTier: 1,
    difficulty: LK_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'lk.social.lecture_hall.1',
        name: 'Attend the Lecture',
        narrativeTemplate: 'The lecturer at {location} opens a record that {name} has not read{?has_faction} — common for those new to the Covenant\'s annal{/has_faction}. The lecture proceeds without decoration.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: '{name} follows every entry. The margin of the Covenant\'s copy fills with a careful second hand.',
        failureAfterimage: 'A date that did not land where it should — {name} notes it but cannot resolve it without further entries.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'eye.positive', weight: 0.3 },
        { kind: 'recent_event', label: 'lecture_attended', delay: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS },
      ],
    },
  },

  {
    id: 'lk.social.debate_forum',
    name: 'Debate Forum',
    locationSubtypes: ['city', 'capital', 'tower'],
    rarityTier: 1,
    difficulty: LK_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'lk.social.debate_forum.1',
        name: 'Argue from the Record',
        narrativeTemplate: 'The forum at {location} debates a contradicting account. {name} argues only from entries — what was said, what was not said, what the margin records as uncertain.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The debate produces a note in the annal: both accounts held, both dated, the contradiction recorded.',
        failureAfterimage: 'The debate produces heat but no new entry. The Covenant notes only: forum held, record unchanged.',
      },
      {
        id: 'lk.social.debate_forum.2',
        name: 'File the Outcome',
        narrativeTemplate: '{?has_faction}Covenant procedure{/has_faction}: the outcome of any forum is itself an entry. What was said. What was not said. The date.',
        reach: 'eye',
        difficulty: (LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP) / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'Entry made. The debate is now part of the record. {name}\'s hand is in the margin.',
        failureAfterimage: 'The entry is incomplete. A name is missing from one side of the debate. The Covenant will follow up.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'eye.positive', weight: 0.4 },
        { kind: 'recent_event', label: 'debate_attended', delay: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS },
      ],
    },
  },

  {
    id: 'lk.social.manuscript_exchange',
    name: 'Manuscript Exchange',
    locationSubtypes: ['city', 'capital', 'tower', 'town'],
    rarityTier: 1,
    difficulty: LK_DIFFICULTY_BASE / 100,
    steps: [
      {
        id: 'lk.social.manuscript_exchange.1',
        name: 'Bring Something to the Table',
        narrativeTemplate: '{name} brings a duplicate entry to the exchange at {location}{?has_faction} on behalf of the Covenant{/has_faction}. A duplicate freely given is a small hole closed in another collection.',
        reach: 'eye',
        difficulty: LK_DIFFICULTY_BASE / 100,
        duration: { min: 1, max: 1 },
        failBehavior: 'block',
        onSuccess: [],
        onFailure: [],
        successAfterimage: 'The exchange goes both ways. A gap in the Covenant\'s annal closes.',
        failureAfterimage: 'The offered entry is not what the other hand needs. The exchange closes without a new record on either side.',
      },
    ],
    aftermathConfig: {
      reactions: [
        { kind: 'reputation_tally', domain: 'eye.positive', weight: 0.4 },
        { kind: 'reputation_tally', domain: 'gold.positive', weight: 0.2 },
        { kind: 'recent_event', label: 'manuscript_exchanged', delay: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS },
      ],
    },
  },
];

// ─── Lifecycle Templates ──────────────────────────────────────────────────

export const LK_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'lk.join',
  name: 'Join the Lorekeepers Covenant',
  locationSubtypes: ['city', 'capital', 'tower'],
  rarityTier: 1,
  difficulty: LK_JOIN_DIFFICULTY / 100,
  steps: [
    {
      id: 'lk.join.1',
      name: 'Present a Record',
      narrativeTemplate: '{name} presents a record at {location} — something observed, precisely noted, with the date in the margin and the hand identified. The Covenant reads it for what was said and what was not said.',
      reach: 'eye',
      difficulty: LK_JOIN_DIFFICULTY / 100,
      duration: { min: 1, max: 2 },
      failBehavior: 'block',
      onSuccess: [],
      onFailure: [],
      successAfterimage: 'The record is accepted into the annal. The Covenant opens a new entry for {name}\'s hand.',
      failureAfterimage: 'The record has opinion in the margin. The Covenant asks {name} to remove the conclusion and return with what was observed.',
    },
    {
      id: 'lk.join.2',
      name: 'Take the Covenant\'s Second Hand',
      narrativeTemplate: '{?has_faction}The Covenant{/has_faction} trains a second hand — a learned script, distinct from personal writing. Every entry {name} makes will carry it.',
      reach: 'eye',
      difficulty: (LK_JOIN_DIFFICULTY + LK_DIFFICULTY_STEP) / 100,
      duration: { min: 1, max: 1 },
      failBehavior: 'block',
      onSuccess: [],
      onFailure: [],
      successAfterimage: 'The second hand is accepted. {name}\'s first official entry closes with the date and the hand. What is remembered will be remembered correctly.',
      failureAfterimage: 'The second hand is not yet clean. The Covenant gives {name} a practice volume and asks them to fill a hundred pages before returning.',
    },
  ],
  aftermathConfig: {
    reactions: [
      { kind: 'faction_reputation_gain', factionDefId: 'lorekeepers_covenant', amount: 0.1 },
      { kind: 'recent_event', label: 'joined_lorekeepers_covenant', delay: 0 },
    ],
  },
};

export const LK_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'lk.promotion',
  name: 'Promotion in the Lorekeepers Covenant',
  locationSubtypes: ['city', 'capital', 'tower'],
  rarityTier: 1,
  difficulty: LK_PROMOTION_DIFFICULTY / 100,
  steps: [
    {
      id: 'lk.promotion.1',
      name: 'Submit the Body of Work',
      narrativeTemplate: 'The Covenant reviews {name}\'s contributions to the annal. Not the quantity — the precision. Were dates fixed? Were contradictions between accounts noted, not resolved?',
      reach: 'eye',
      difficulty: LK_PROMOTION_DIFFICULTY / 100,
      duration: { min: 1, max: 2 },
      failBehavior: 'block',
      onSuccess: [],
      onFailure: [],
      successAfterimage: 'The body of work is accepted. Every margin is clean. Every date lands where it should.',
      failureAfterimage: 'One entry has a date that does not land. The Covenant asks {name} to correct it and return.',
    },
    {
      id: 'lk.promotion.2',
      name: 'Receive the New Designation',
      narrativeTemplate: 'The new rank{?has_faction} within the Covenant{/has_faction} carries a new section of the annal to maintain. More entries. More margins. More of what is remembered.',
      reach: 'eye',
      difficulty: (LK_PROMOTION_DIFFICULTY + LK_DIFFICULTY_STEP) / 100,
      duration: { min: 1, max: 1 },
      failBehavior: 'block',
      onSuccess: [],
      onFailure: [],
      successAfterimage: 'The section is assigned. {name}\'s hand will be in these margins for a generation. The Covenant is warm about this.',
      failureAfterimage: 'The new section is larger than {name} expected. The Covenant says: that is always true of the next rank.',
    },
  ],
  aftermathConfig: {
    reactions: [
      { kind: 'faction_reputation_gain', factionDefId: 'lorekeepers_covenant', amount: 0.2 },
      { kind: 'recent_event', label: 'lorekeepers_promotion', delay: 1 },
    ],
  },
};

export const LK_LIFECYCLE_TEMPLATES: UnifiedActionTemplate[] = [LK_JOIN_TEMPLATE, LK_PROMOTION_TEMPLATE];

// ─── Full Export ──────────────────────────────────────────────────────────

export const ALL_LK_TEMPLATES: UnifiedActionTemplate[] = [
  ...LOREKEEPERS_COVENANT_ENCOUNTER_TEMPLATES,
  ...LOREKEEPERS_SENIOR_TEMPLATES,
  ...LOREKEEPERS_ELITE_TEMPLATES,
  ...LOREKEEPERS_SOCIAL_TEMPLATES,
  ...LK_LIFECYCLE_TEMPLATES,
];

export function getLorekeeperCovenantEncounterById(id: string): UnifiedActionTemplate | undefined {
  return ALL_LK_TEMPLATES.find(t => t.id === id);
}
