/**
 * Lorekeepers Covenant Encounter Content — full UnifiedActionTemplate format (THR-96).
 *
 * Voice bible: quiet, precise, patient. The Covenant knows the world forgets and
 * considers that a personal affront. Scholarly without obsession — warm where the
 * Arcane Circle is cold; the Covenant loves what it keeps.
 * Load-bearing lexicon: record, annal, entry, margin, hand, date, what was said,
 * what was not said, what is remembered. Never: story, myth.
 *
 * Systemic signature: intelligence grants (the defining affinity — every archival
 * discovery yields a concrete, consumable record), encounter seeds (research threads
 * — partial discoveries seed follow-up investigations), hidden marks (forbidden
 * knowledge exposure), {?has_artifact} branches (cipher stones, star charts, provenance
 * ledgers change the stakes of Covenant work).
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

  withEncounterContract({
    id: 'lk.quest.catalogue_ruins',
    name: 'Catalogue the Ruins',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['ruins', 'city', 'capital', 'tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: LK_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A newly uncovered site at {location} has no entry in the Covenant\'s annal. {name} is sent to open the record.' +
          '{?has_artifact} {artifact:any} in {their} possession might help fix the provenance — a dated object is worth a dozen margin notes.{/has_artifact}' +
          '{?no_artifact} The site will have to yield its date from the masonry alone.{/no_artifact}',
        successAfterimage: 'The site is surveyed. The first entry is made. The margin notes the date.',
        failureAfterimage: 'The site is unstable. The first entry is incomplete. The date is recorded with a question mark.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          '{?has_faction}The Covenant archivist{/has_faction} at the Covenant records what was said at the site and, more carefully, what was not said.',
        successAfterimage: 'The record is complete. The margin is clean. What is remembered will be remembered correctly.',
        failureAfterimage: 'A gap in the record. The Covenant will reconstruct it from other hands. For one generation, something will be remembered slightly wrong.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} surveys a newly uncovered site at {location}. No entry exists yet in the annal. The Covenant does not leave gaps willingly.',
      success:
        'The site has an entry and a date. The margin is clean.',
      failure:
        'The entry is incomplete. The Covenant will reconstruct it from other hands.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The ruins at {location} have a record now — or the beginning of one. The Covenant adds it to the annal with the date and the hand.',
        changes: [
          {
            id: 'ruins_catalogued',
            kind: 'reputation',
            title: 'Ruin Catalogued',
            detail: 'A site with no prior entry is now part of the Covenant\'s record.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god keep from the first entry?',
        reactions: [
          {
            id: 'lk.cat_ruins.enter',
            label: 'Make the entry precise. A first record shapes every hand that follows.',
            intent:
              'You steady {name}\'s margin note — date, condition, what was said, what was not. ' +
              'First entries set the standard for everything that comes after them in the annal.',
            effects: [
              {
                kind: 'intelligence' as const,
                category: 'cultural_knowledge',
                label: 'Ruin survey — {location}',
                detail:
                  'Newly catalogued site. First entry in the Covenant\'s annal — condition at survey, ' +
                  'date fixed or estimated, provenance uncertain pending cross-reference.',
              },
              {
                kind: 'intel_referenced_prose' as const,
                category: 'cultural_knowledge',
                prose: {
                  reliable:
                    '{name} set the margin notes against earlier entries the Covenant had carried — the cross-reference came back exact, and the first record at {location} fell into place against a precedent already known.',
                  uncertain:
                    '{name} reached for the earlier records this site resembled — half the analogues held, half had drifted, and the entry took the shape they could justify.',
                  dubious:
                    '{name} measured the ruin against the lore they thought matched it, and the match refused to settle — the precedent had been older, or wrong, or about a different ruin entirely.',
                },
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.cat_ruins.seed',
            label: 'Mark the gap. A record with a question mark invites a second expedition.',
            intent:
              'You plant the follow-up — not yet, but soon. The Covenant does not leave open entries open forever.',
            effects: [
              {
                kind: 'encounter_seed' as const,
                templateId: 'lk.senior.excavate_archive',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 2,
                seedLabel: 'Incomplete ruin entry at {location} warrants a senior excavation survey',
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.cat_ruins.pass',
            label: 'Let the entry stand. The Covenant has patience.',
            intent: 'The work is what the work is. Some records need time to complete themselves.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'lk.quest.translate_text',
    name: 'Translate the Text',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['tower', 'city', 'capital', 'library'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: LK_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The document arrived at {location} with no provenance. {name} reads the hand carefully — what was written and, between the lines, what was not said.' +
          '{?has_artifact} {artifact:any} provides a cipher key or period reference — the hand may fall into place faster than it would from context alone.{/has_artifact}',
        successAfterimage: 'The hand is identified. The date is estimated. The record opens.',
        failureAfterimage: 'The hand is unknown. The date cannot be fixed. The margin stays blank.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          '{?has_faction}The Covenant{/has_faction} requires the translation in the second hand — precise, without the translator\'s opinion in the margins.',
        successAfterimage: 'Entry rendered. The annal grows by one. What is remembered will be remembered correctly.',
        failureAfterimage: 'Opinion crept in. The Covenant\'s senior archivist will re-render it. {name}\'s translation goes in the appendix.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} reads a document without provenance at {location}. The Covenant needs the hand identified and the entry made without the translator\'s opinion in the margins.',
      success:
        'The translation is rendered in the second hand. The annal grows.',
      failure:
        'Opinion crept in. The entry goes to the appendix.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The document from {location} has an entry now. The hand is identified. What is remembered will be remembered — if not correctly, at least precisely.',
        changes: [
          {
            id: 'text_translated',
            kind: 'reputation',
            title: 'Text Translated',
            detail: 'A document without provenance has a Covenant entry and a date.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god keep from the translation?',
        reactions: [
          {
            id: 'lk.trans.record',
            label: 'Fix the hand. A name in the margin is worth a shelf of unsigned volumes.',
            intent:
              'You steady {name}\'s identification — this hand, this period, this place. ' +
              'What was written is now something the annal can cite.',
            effects: [
              {
                kind: 'intelligence' as const,
                category: 'cultural_knowledge',
                label: 'Document translation — {location}',
                detail:
                  'Hand identified, date estimated, provenance partial. Translation rendered in the Covenant\'s second hand. ' +
                  'Contents on record — subject matter and period now citable by subsequent researchers.',
              },
              {
                kind: 'intel_referenced_prose' as const,
                category: 'cultural_knowledge',
                prose: {
                  reliable:
                    '{name} read the hand against the catalogue {they} already carried — the period was a known period, the regional tilt of the script familiar, and the translation settled fast.',
                  uncertain:
                    '{name} matched the hand to remembered exemplars where {they} could — close on the period, looser on the region, and the translation took the shape the partial match allowed.',
                  dubious:
                    '{name} measured the hand against the precedents {they} thought {they} knew, and the precedents refused — wrong period, or wrong region, or both, and the translation surfaced suspect against itself.',
                },
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.trans.seed',
            label: 'Note what the translation implies. Some entries open rather than close.',
            intent:
              'You mark the implication — not as interpretation, but as a direction for a later hand. ' +
              'What was found opens a line of inquiry the Covenant should follow.',
            effects: [
              {
                kind: 'encounter_seed' as const,
                templateId: 'lk.senior.decipher_prophecy',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS,
                seedLabel: 'Translation at {location} contains implications a senior scholar should assess',
              },
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.trans.pass',
            label: 'Let the entry stand. Not every translation needs a follow-up.',
            intent: 'The document is in the annal. The Covenant will find what it implies in time.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'lk.quest.recover_tome',
    name: 'Recover a Missing Tome',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['ruins', 'city', 'capital', 'tower', 'dungeon'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: LK_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'An entry in the annal references a volume not in the Covenant\'s vaults. {name} traces the last recorded hand at {location}.' +
          '{?has_artifact} {artifact:any} provides a reference point — a dated object that narrows the trail.{/has_artifact}',
        successAfterimage: 'The volume\'s last known location is identified. The record confirms it exists.',
        failureAfterimage: 'The trail goes cold. The last entry in the margin is two centuries back.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The tome must be returned{?has_faction} to the Covenant{/has_faction} undamaged. A torn page is a small hole the world falls into later.',
        successAfterimage: 'Volume returned. Condition noted. The record updates. The hole closes.',
        failureAfterimage: 'Damage to the binding. The Covenant catalogues the loss precisely before attempting repair.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} traces a volume the annal references but cannot locate. ' +
        'The Covenant does not accept missing as a final state — only unrecovered.',
      success:
        'The volume is returned, condition noted, hole closed.',
      failure:
        'The damage is catalogued. The Covenant notes the loss precisely.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The volume is back — or its absence is properly recorded for the first time. ' +
          'The Covenant updates the annal either way.',
        changes: [
          {
            id: 'tome_recovered',
            kind: 'item',
            title: 'Volume Located',
            detail: 'A missing tome is either returned or its fate entered in the annal.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god take from the recovered volume?',
        reactions: [
          {
            id: 'lk.tome.record',
            label: 'Note the volume\'s contents. Recovery is only useful if the entry survives it.',
            intent:
              'You steady {name}\'s hand as {they} open{s} the binding and take{s} the first notes. ' +
              'The tome is back. What it holds is now citable.',
            effects: [
              {
                kind: 'intelligence' as const,
                category: 'cultural_knowledge',
                label: 'Recovered tome — {location}',
                detail:
                  'Missing volume located and returned to the Covenant\'s vaults. ' +
                  'Contents catalogued; provenance confirmed against prior annal entry.',
              },
              {
                kind: 'intel_referenced_prose' as const,
                category: 'cultural_knowledge',
                prose: {
                  reliable:
                    '{name} opened the binding and the contents fell into a context {they} already held — the related texts, the prior commentary, the shape of what this volume completed.',
                  uncertain:
                    '{name} read against the surrounding scholarship {they} half-remembered — most lined up, some did not, and the entry took the shape that careful annotation allowed.',
                  dubious:
                    '{name} reached for the context the lore had once supplied, and the context refused to hold — the recovered text spoke to a tradition {name} had been carrying wrong.',
                },
              },
              {
                kind: 'hidden_mark' as const,
                category: 'secret_knowledge',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label: 'Holds the knowledge that the recovered tome contains',
                revealFamilies: ['lk.senior', 'investigation'],
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.tome.seed',
            label: 'Follow what the tome implies. Not every recovery is an ending.',
            intent:
              'The volume raises as many questions as it closes. You mark the thread for a senior scholar.',
            effects: [
              {
                kind: 'encounter_seed' as const,
                templateId: 'lk.senior.compose_treatise',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS,
                seedLabel: 'Recovered tome at {location} contains material worth a full treatise',
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.tome.pass',
            label: 'Let the recovery stand. The annal has what it needs.',
            intent: 'The hole is closed. That is enough.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'lk.quest.map_ley_lines',
    name: 'Map the Ley Lines',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['wilderness', 'ruins', 'town', 'city'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The Covenant\'s annal has entries describing lines of resonance near {location} that have never been formally recorded. {name} is sent to make the entry.' +
          '{?has_artifact} {artifact:any} calibrates against the resonance — a dated reference object narrows the survey considerably.{/has_artifact}' +
          '{?no_artifact} Without a reference instrument, {name} walks the lines by feel alone — slower, but possible.{/no_artifact}',
        successAfterimage: 'The lines are walked and marked. The date is fixed. The margin is clean.',
        failureAfterimage: 'The resonance is faint. The entry is made with uncertainty noted. The Covenant will send someone again next generation.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: LK_DIFFICULTY_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          '{name} files the survey{?has_faction} with the Covenant archivists{/has_faction}. The margin receives the date and the hand that walked it.',
        successAfterimage: 'Survey filed. The record keeps. What is remembered of the lines will be remembered correctly now.',
        failureAfterimage: 'Contradictions with earlier entries. The Covenant will hold both accounts and note the discrepancy.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} walks resonance lines near {location} that have never been formally entered in the annal. ' +
        'The Covenant does not trust unrecorded lines — only lines with a date and a hand.',
      success:
        'Survey filed. The lines have a date and a hand.',
      failure:
        'Contradictions with prior entries. The Covenant holds both accounts.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The ley lines near {location} are in the annal now — or the contradiction between accounts is properly entered. ' +
          'The Covenant records what was found, not what was expected.',
        changes: [
          {
            id: 'ley_lines_mapped',
            kind: 'reputation',
            title: 'Ley Lines Surveyed',
            detail: 'Lines of resonance near {location} have their first formal entry.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god note in the survey margin?',
        reactions: [
          {
            id: 'lk.ley.record',
            label: 'Fix the node. A ley-line entry with a date becomes a reference others can cite.',
            intent:
              'You press the survey into the record — hex position, resonance direction, date of walking. ' +
              'The Arcane Circle will want this. The Covenant will provide it.',
            effects: [
              {
                kind: 'intelligence' as const,
                category: 'shrine_location',
                label: 'Ley-line node surveyed near {location}',
                detail:
                  'Resonance lines formally walked and entered. Date fixed. Survey includes node position, ' +
                  'approximate strength, and any discrepancies with prior unverified accounts in the annal.',
              },
              {
                kind: 'intel_referenced_prose' as const,
                category: 'shrine_location',
                prose: {
                  reliable:
                    '{name} walked the resonance against the shrine geometries already entered in the annal — the alignments matched the records they should have matched, and the survey closed clean.',
                  uncertain:
                    '{name} measured the lines against half-remembered shrine alignments — close enough to ratify the node, off enough that the margin received a careful note about which prior entry the survey resembled.',
                  dubious:
                    '{name} compared the resonance to the consecrated geometry {they} thought {they} knew, and the geometry had moved — the prior entry had named a sanctuary that no longer stood where it had been recorded.',
                },
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.ley.pass',
            label: 'Let the survey stand. Not every margin note needs a second opinion.',
            intent: 'The entry is made. The lines have a record.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'lk.quest.interview_elder',
    name: 'Interview an Elder',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital', 'village'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: LK_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The elder at {location} has lived through an event the Covenant has no entry for. {name} must take what was said — and note what was not said.' +
          '{?has_artifact} {artifact:any} establishes credibility — the elder recognizes a Covenant instrument and opens sooner.{/has_artifact}',
        successAfterimage: 'The elder speaks. {name} records every word and leaves space in the margin for what was held back.',
        failureAfterimage: 'The elder is reluctant. The account is partial. The margin notes the reluctance.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          '{?has_faction}The Covenant\'s archivists{/has_faction} check the new account against the existing annal. Contradictions between accounts are never resolved by erasure.',
        successAfterimage: 'The account fits. The entry is made under the correct date. What is remembered is a little more exact.',
        failureAfterimage: 'A date does not land where it should. The Covenant opens a second entry to hold both accounts.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} opens the account of an elder who witnessed events with no prior entry in the annal. ' +
        'The Covenant wants what was said — and what was not said — both.',
      success:
        'The account is entered correctly. What is remembered is a little more exact.',
      failure:
        'A date does not land. The Covenant opens a second entry to hold both accounts.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The elder\'s account is in the annal now — or the contradiction between the account and prior entries is properly held. ' +
          'The Covenant records both when it cannot reconcile them.',
        changes: [
          {
            id: 'elder_interviewed',
            kind: 'reputation',
            title: 'Elder Account Recorded',
            detail: 'An oral account of an unrecorded event is now in the Covenant\'s annal.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god read in the elder\'s margin?',
        reactions: [
          {
            id: 'lk.elder.record',
            label: 'File the account. An oral record in the annal is a kind of permanence the elder cannot give it alone.',
            intent:
              'You steady the account — date, witness, what was said, what was held back. ' +
              'The elder\'s memory will fade. The annal will keep it.',
            effects: [
              {
                kind: 'intelligence' as const,
                category: 'cultural_knowledge',
                label: 'Elder account — {location}',
                detail:
                  'Oral testimony of an event with no prior Covenant entry. ' +
                  'Account cross-referenced against existing annal — contradictions noted, not resolved.',
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.elder.mark',
            label: 'Mark what the elder held back. Reluctance is itself a kind of record.',
            intent:
              'The elder spoke but did not tell everything. You note the shape of what was omitted — ' +
              'not the content, but the fact and the posture of withholding.',
            effects: [
              {
                kind: 'hidden_mark' as const,
                category: 'secret_knowledge',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label: 'Elder at {location} withheld part of their account from the Covenant',
                revealFamilies: ['lk.senior', 'investigation', 'hod.senior'],
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.elder.pass',
            label: 'Let the account stand. The margin holds what it holds.',
            intent: 'The entry is made. The Covenant will follow up when the elder is ready — or when they are gone.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Senior Quest Templates ───────────────────────────────────────────────

export const LOREKEEPERS_SENIOR_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'lk.senior.decipher_prophecy',
    name: 'Decipher a Prophecy',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['tower', 'city', 'capital', 'ruins'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: LK_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The document arrived at {location} with two competing transcriptions. {name} must establish which hand is primary before the decipherment can begin.' +
          '{?has_artifact} {artifact:any} provides a cipher anchor — a reference point that fixes one of the two hands.{/has_artifact}' +
          '{?no_artifact} Without a cipher anchor, {name} works from internal consistency alone.{/no_artifact}',
        successAfterimage: 'Primary hand confirmed. The record establishes which text will serve as the entry.',
        failureAfterimage: 'The hands cannot be ordered with certainty. Both are entered, each with their uncertainties noted.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (LK_SENIOR_BASE + LK_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          '{?has_faction}The senior archivist of the Covenant{/has_faction} requires the entry to distinguish what was said from what was later remembered to have been said.',
        successAfterimage: 'Entry made. The distinction holds. The Covenant\'s record is precise on what was known and when.',
        failureAfterimage: 'The layers conflate. The entry is flagged. A future hand will need to unsort it.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: LK_SENIOR_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { tierPromotionEligible: true },
        narrativeTemplate:
          'The Covenant records the implication in the margin — not as prophecy, but as what the record suggests when the date is correct.',
        successAfterimage: '{name} signs the margin in the Covenant\'s second hand. What is remembered will be remembered correctly.',
        failureAfterimage: 'The margin note is imprecise. The senior archivist will revise it in the next session.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} establishes which hand is primary before the decipherment of a competing-transcription document can begin. ' +
        'The Covenant will not enter a prophecy it cannot date.',
      success:
        'Entry made. The distinction holds. The margin is signed.',
      failure:
        'The margin note is imprecise. A future hand will revise it.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The decipherment is entered — the primary hand established, the implication noted in the margin, not as prophecy but as dated record. ' +
          'The Covenant has its entry. What it implies is for a later hand to judge.',
        changes: [
          {
            id: 'prophecy_deciphered',
            kind: 'reputation',
            title: 'Prophecy Entered',
            detail: 'A document with competing transcriptions has a Covenant entry with a primary hand.',
            polarity: 'gain',
          },
          {
            id: 'prophecy_knowledge',
            kind: 'future_hook',
            title: 'Prophetic Record',
            detail: 'The Covenant holds the deciphered implication. Downstream institutions may act on it.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'What does the god keep from the margin of the prophecy?',
        reactions: [
          {
            id: 'lk.decipher.record',
            label: 'Enter the implication. A prophecy in the Covenant\'s annal is not a prophecy — it is a dated claim.',
            intent:
              'You make the entry a claim, not a prediction. The date is what matters. The implication is in the margin, ' +
              'unsigned by interpretation, available to any institution that knows how to read a Covenant entry.',
            effects: [
              {
                kind: 'intelligence' as const,
                category: 'political_secret',
                label: 'Deciphered prophecy — primary hand established, implication recorded',
                detail:
                  'Document with two competing transcriptions — primary hand identified, date range fixed. ' +
                  'Implication entered in margin: dated reference point, not active prediction. ' +
                  'Holy Order inquisitors and Civic Guard prosecutors may find the reference actionable.',
              },
              {
                kind: 'intel_referenced_prose' as const,
                category: 'political_secret',
                prose: {
                  reliable:
                    '{name} read the implication against the court alignments {they} already carried — the dated reference fell into a pattern of leverage {they} knew, and the margin note placed it precisely.',
                  uncertain:
                    '{name} weighed the implication against the political map {they} half-remembered — the central wedge still held, but several actors named in the margin had moved since the dossier was current.',
                  dubious:
                    '{name} reached for the courtly context the rumor had supplied, and reached past it — the implication landed in a political landscape that no longer arranged itself the way the briefing had described.',
                },
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 2 },
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.decipher.mark',
            label: 'Mark what the decipherment revealed. Some knowledge is only safe in a Covenant margin.',
            intent:
              'The decipherment revealed something the two transcriptions were hiding together — ' +
              'not by error but by design. You mark the discovery quietly.',
            effects: [
              {
                kind: 'hidden_mark' as const,
                category: 'political_secret',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label: 'Knows what the competing transcriptions were concealing',
                revealFamilies: ['lk.elite', 'hod.senior', 'investigation'],
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.decipher.seed',
            label: 'Send the implication forward. This entry will need a senior scholar to follow it.',
            intent:
              'The margin note is the beginning of something. You plant the thread — ' +
              'the next investigation will find it waiting.',
            effects: [
              {
                kind: 'encounter_seed' as const,
                templateId: 'lk.elite.cosmic_revelation',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 2,
                seedLabel: 'Deciphered prophecy at {location} contains an implication only a cosmic-scale investigation can resolve',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'lk.senior.excavate_archive',
    name: 'Excavate a Lost Archive',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['ruins', 'dungeon', 'tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: LK_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The annal places a pre-Collapse archive below {location}. {name} leads the survey team. The Covenant wants entries, not artifacts.' +
          '{?has_artifact} {artifact:any} provides a provenance anchor — a period reference that narrows the excavation before a spade is lifted.{/has_artifact}',
        successAfterimage: 'The vault entrance is confirmed. The date and hand of the original sealing is recovered from the lintel inscription.',
        failureAfterimage: 'The vault is collapsed. Some entries will be recovered. The Covenant is patient.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (LK_SENIOR_BASE + LK_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { tierPromotionEligible: true },
        narrativeTemplate:
          '{?has_faction}Covenant protocol{/has_faction} requires the location and condition of every document recorded before anything is moved. A page torn in transit is a hole.',
        successAfterimage: 'Complete site record. Every entry catalogued in situ. The removal proceeds with no holes.',
        failureAfterimage: 'Pressure from the site\'s instability — some entries made under duress. The margins carry the uncertainty.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} leads a survey team below {location} in search of a pre-Collapse archive the annal references but cannot locate. ' +
        'The Covenant wants entries. What they find stays in the ground until it is properly recorded.',
      success:
        'Complete site record. The removal proceeds with no holes.',
      failure:
        'Some entries made under duress. The margins carry the uncertainty.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The archive below {location} has an entry in the Covenant\'s annal now — ' +
          'the vault located, the documents catalogued in situ or the uncertainty of the site properly recorded. ' +
          'What was sealed is no longer entirely lost.',
        changes: [
          {
            id: 'archive_excavated',
            kind: 'reputation',
            title: 'Archive Excavated',
            detail: 'A pre-Collapse archive has its first Covenant entry.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god take from the vault?',
        reactions: [
          {
            id: 'lk.excav.record',
            label: 'Enter the vault contents. What was sealed below {location} is now citable.',
            intent:
              'You steady {name}\'s hand as {they} open{s} the first sealed volume and take{s} the provenance entry. ' +
              'What was sealed is now part of the record.',
            effects: [
              {
                kind: 'intelligence' as const,
                category: 'cultural_knowledge',
                label: 'Pre-Collapse archive excavated below {location}',
                detail:
                  'Archive located below {location} — vault entrance dated from lintel inscription. ' +
                  'Documents catalogued in situ prior to removal. Contents span a period not represented elsewhere in the annal.',
              },
              {
                kind: 'intel_referenced_prose' as const,
                category: 'cultural_knowledge',
                prose: {
                  reliable:
                    '{name} read the vault\'s contents against the pre-Collapse scholarship {they} had already mastered — the lintel hand was a hand the annal knew, and the period fell into place with the unhurried certainty of recognized work.',
                  uncertain:
                    '{name} measured the documents against the periods the annal had partially mapped — some entries closed cleanly against precedent, some required the careful margin note that meant comparable but unconfirmed.',
                  dubious:
                    '{name} reached for the period the lore had named, and the period refused — the sealing predated everything the Covenant had ever recorded, and what {they} carried as expertise was no longer expertise here.',
                },
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.excav.mark',
            label: 'Note who sealed it. A vault sealed by a named hand is a political record as much as an archival one.',
            intent:
              'The lintel inscription named the sealing authority. That name belongs in a margin — ' +
              'the Covenant does not let institutional decisions disappear with the institution.',
            effects: [
              {
                kind: 'hidden_mark' as const,
                category: 'secret_knowledge',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label: 'Knows the authority that originally sealed the archive below {location}',
                revealFamilies: ['lk.elite', 'hod.senior.inquisition', 'investigation'],
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.excav.seed',
            label: 'Send what you found to the treaty room. The archive implies a treatise.',
            intent:
              'The excavation found more than the Covenant expected. You forward the implication — ' +
              'a treatise should follow.',
            effects: [
              {
                kind: 'encounter_seed' as const,
                templateId: 'lk.senior.compose_treatise',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS,
                seedLabel: 'Archive excavated at {location} — contents warrant a full Covenant treatise',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'lk.senior.compose_treatise',
    name: 'Compose a Treatise',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: ['tower', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: LK_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          '{name} assembles every relevant entry in the Covenant\'s annal covering {location}. What was said. What was not said. What is remembered.' +
          '{?has_artifact} {artifact:any} provides a cross-reference anchor — a dated object or text that fixes one contested entry.{/has_artifact}',
        successAfterimage: 'Entries gathered. Contradictions between accounts are all noted, not resolved.',
        failureAfterimage: 'Two entries cannot be located. The treatise will carry a note: record incomplete.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (LK_SENIOR_BASE + LK_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { tierPromotionEligible: true },
        narrativeTemplate:
          '{?has_faction}The Covenant\'s senior archivist{/has_faction} will review the commentary for opinion. The commentary may describe but not argue.',
        successAfterimage: 'Commentary clean. The treatise goes to the annals. {name} signs the margin in the second hand.',
        failureAfterimage: 'Opinion in the margin. The senior archivist sets a pen to it. The revision is not unkind — just exact.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} gathers every entry the Covenant holds on {location} and opens the commentary. ' +
        'The commentary may describe but not argue — opinion in the margin is the cardinal failure.',
      success:
        'The treatise enters the annals. The commentary is clean.',
      failure:
        'Opinion in the margin. The senior archivist revises without unkindness.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The treatise is in the annal — all entries gathered, contradictions noted, commentary clean. ' +
          '{name}\'s hand is in the margin of a document that will be cited for generations.',
        changes: [
          {
            id: 'treatise_composed',
            kind: 'reputation',
            title: 'Treatise Composed',
            detail: 'A synthesis of all Covenant entries on a subject is now in the annal.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god press into the treatise\'s margin?',
        reactions: [
          {
            id: 'lk.treatise.record',
            label: 'Enter the synthesis. A treatise in the Covenant\'s hand is a form of permanence.',
            intent:
              'You confirm the entry — contradictions noted, commentary clean, {name}\'s second hand in the margin. ' +
              'What the Covenant knows about this subject is now held in one place.',
            effects: [
              {
                kind: 'intelligence' as const,
                category: 'cultural_knowledge',
                label: 'Covenant treatise — {location}',
                detail:
                  'Synthesis treatise covering all Covenant entries on {location} and relevant period. ' +
                  'Contradictions between accounts noted and preserved, not resolved. ' +
                  'Commentary describes without arguing. Available for citation by downstream scholars and institutions.',
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 2 },
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.treatise.pass',
            label: 'Let the treatise stand. The annal has what it needs.',
            intent: 'The work is done. The margin is {name}\'s. The Covenant will find the implications in time.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Elite Quest Templates ────────────────────────────────────────────────

export const LOREKEEPERS_ELITE_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'lk.elite.forbidden_library',
    name: 'Access the Forbidden Library',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['ruins', 'tower', 'dungeon', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: LK_ELITE_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The library at {location} holds entries the Covenant has no duplicate of. The access question is not moral — it is procedural. {name} negotiates the record.',
        successAfterimage: 'Access established. The Covenant\'s interest in the record — not the collection — is accepted.',
        failureAfterimage: 'Access denied. The Covenant notes the denial in the annal with the date and the name of who held the door.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (LK_ELITE_BASE + LK_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Time is short{?has_faction} — the Covenant expects {name} to record entries, not acquire volumes{/has_faction}. What was said on each page. What was not said in any margin.' +
          '{?has_artifact} {artifact:any} — a reading instrument or cipher key — accelerates the work when the writing style is unfamiliar.{/has_artifact}',
        successAfterimage: 'The record is taken. The library\'s entries enter the Covenant\'s annal for the first time. What is remembered grows.',
        failureAfterimage: 'Incomplete record. The window closed before the final entries. The Covenant will try again — in another generation, with a different hand.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: LK_ELITE_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { tierPromotionEligible: true },
        narrativeTemplate:
          'The record is useless in the field. It must reach the Covenant\'s vaults, where it can be dated and entered properly.',
        successAfterimage: 'Record delivered. The vault opens a new section. {name}\'s hand is in the margin on every page.',
        failureAfterimage: 'Partial delivery. Three entries were lost in transit. The Covenant notes the holes — a small record of what cannot now be remembered.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} negotiates access to entries at {location} that the Covenant has no duplicate of. ' +
        'The Covenant\'s interest is in the record, not the collection. Whether the door opens depends on whether that distinction is understood.',
      success:
        'New entries in the annal. {name}\'s hand is in the margin of every page.',
      failure:
        'Access denied, or the record lost in transit. The Covenant notes the hole.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The forbidden library at {location} has contributed to the annal — or its denial has been recorded with the name of whoever held the door. ' +
          'The Covenant keeps both outcomes. An access denied is a dated entry too.',
        changes: [
          {
            id: 'library_accessed',
            kind: 'reputation',
            title: 'Forbidden Library Accessed',
            detail: 'Entries from a restricted collection are now in the Covenant\'s annal.',
            polarity: 'gain',
          },
          {
            id: 'forbidden_knowledge',
            kind: 'future_hook',
            title: 'Forbidden Record Held',
            detail: 'The Covenant holds entries that were deliberately kept from common access.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'What does the god keep from the forbidden pages?',
        reactions: [
          {
            id: 'lk.forbid.enter',
            label: 'Enter two records. What was in the first section. What was in the section they tried to block.',
            intent:
              'You steady {name}\'s hand for the most important entries — the ones that someone decided ' +
              'were not for general knowledge. The Covenant disagrees with that decision.',
            effects: [
              {
                kind: 'intelligence' as const,
                category: 'political_secret',
                label: 'Forbidden library records — {location}, first section',
                detail:
                  'Entries from a restricted collection at {location}. First section: general archive material, ' +
                  'notable for what is absent from the public record. Dated and entered in the Covenant\'s second hand.',
              },
              {
                kind: 'intelligence' as const,
                category: 'political_secret',
                label: 'Forbidden library records — {location}, restricted section',
                detail:
                  'Entries from the restricted section of the {location} collection. ' +
                  'Contents deliberately withheld from common access — subject matter politically sensitive. ' +
                  'Holy Order inquisitors and Civic Guard prosecutors may find the records actionable.',
              },
              {
                kind: 'hidden_mark' as const,
                category: 'forbidden_contact',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label: 'Accessed the forbidden library at {location}',
                revealFamilies: ['lk.elite', 'investigation', 'hod.senior'],
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.forbid.seed',
            label: 'Mark the next library. The one they did not show you will have its own entry eventually.',
            intent:
              'The restricted section referenced a second collection — not at {location}, but somewhere the library\'s handlers considered safer. ' +
              'You mark the implication for a later expedition.',
            effects: [
              {
                kind: 'encounter_seed' as const,
                templateId: 'lk.elite.forbidden_library',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 4,
                seedLabel: 'Forbidden library at {location} referenced a second restricted collection elsewhere',
                priority: 1.5,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.forbid.pass',
            label: 'Let the record stand. The Covenant has what it came for.',
            intent: 'The new entries are in the annal. What they imply is for a later hand.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'lk.elite.cosmic_revelation',
    name: 'Cosmic Revelation',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['ruins', 'tower', 'capital', 'observatory'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: LK_ELITE_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'An entry in the oldest section of the annal contains a date that does not land where it should. {name} is sent to {location} to find what that date refers to.' +
          '{?has_artifact} {artifact:any} — a star chart, observation instrument, or calibrated reference — may fix the date against an independent axis.{/has_artifact}' +
          '{?no_artifact} The date must be reconciled from the site alone — the oldest method, and the most reliable when it works.{/no_artifact}',
        successAfterimage: 'The date refers to something not in any other record. {name} opens a new entry: the first account.',
        failureAfterimage: 'The date\'s referent is still unclear. The Covenant files {name}\'s working notes in the appendix.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (LK_ELITE_BASE + LK_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { tierPromotionEligible: true },
        narrativeTemplate:
          '{?has_faction}The Covenant\'s doctrine{/has_faction}: a record unkept because the recorder did not understand it is a hole. Record what was observed. Let a later hand supply the meaning.',
        successAfterimage: 'The observation is entered precisely, without interpretation. The margin notes the date and the hand. What is remembered waits for what will one day be understood.',
        failureAfterimage: 'Interpretation crept in. The entry is made, but the senior archivist removes {name}\'s conclusion, leaving the observation intact.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} investigates a date in the oldest section of the annal that does not land where it should. ' +
        'The Covenant records what was observed. A later hand will supply the meaning.',
      success:
        'The observation is entered precisely. What is remembered waits for what will be understood.',
      failure:
        'Interpretation crept in. The appendix holds {name}\'s working notes.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The date in the oldest section of the annal has a referent now — or the referent\'s elusiveness is properly entered. ' +
          'The Covenant does not resolve what it cannot date. It holds what it observed until a later hand can interpret it.',
        changes: [
          {
            id: 'cosmic_entered',
            kind: 'reputation',
            title: 'Cosmic Observation Entered',
            detail: 'An unexplained date in the oldest section of the annal has its first substantive entry.',
            polarity: 'gain',
          },
          {
            id: 'cosmic_record',
            kind: 'future_hook',
            title: 'Observation Without Interpretation',
            detail: 'The Covenant holds an observation it cannot yet explain. That gap is itself a kind of record.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'What does the god read in the entry that waits for a later hand?',
        reactions: [
          {
            id: 'lk.cosmic.enter',
            label: 'Enter the observation precisely. What is remembered waits for what will be understood.',
            intent:
              'You press the Covenant\'s doctrine into the margin — observation without interpretation, ' +
              'the date and the hand, the referent and its absence of explanation. ' +
              'A later generation will find this entry and know where to begin.',
            effects: [
              {
                kind: 'intelligence' as const,
                category: 'cultural_knowledge',
                label: 'Cosmic observation — date without referent, {location}',
                detail:
                  'Date in the oldest section of the Covenant\'s annal has been investigated at {location}. ' +
                  'Observation entered precisely — what was seen, what cannot be explained yet. ' +
                  'No interpretation in the margin. Referent remains open for a later hand.',
              },
              {
                kind: 'hidden_mark' as const,
                category: 'secret_knowledge',
                severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                label: 'Holds an observation the Covenant cannot yet interpret',
                revealFamilies: ['lk.elite', 'investigation', 'star'],
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 2 },
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.cosmic.seed',
            label: 'Plant the thread. Some observations need a follow-up that is itself an investigation.',
            intent:
              'The observation opened something that the single expedition at {location} could not close. ' +
              'You plant the follow-up for a future scholar.',
            effects: [
              {
                kind: 'encounter_seed' as const,
                templateId: 'lk.elite.cosmic_revelation',
                delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 5,
                seedLabel: 'Cosmic observation at {location} implies a second investigation is needed',
                priority: 1.3,
              },
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.cosmic.pass',
            label: 'Let the entry wait. The observation is in the margin. The meaning will come.',
            intent: 'The Covenant is patient. What is remembered today will still be remembered when the interpretation arrives.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Social Templates ─────────────────────────────────────────────────────

export const LOREKEEPERS_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [

  withEncounterContract({
    id: 'lk.social.lecture_hall',
    name: 'Lecture Hall',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['city', 'capital', 'tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: LK_DIFFICULTY_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The lecturer at {location} opens a record that {name} has not read{?has_faction} — common for those new to the Covenant\'s annal{/has_faction}. The lecture proceeds without decoration.',
        successAfterimage: '{name} follows every entry. The margin of the Covenant\'s copy fills with a careful second hand.',
        failureAfterimage: 'A date that did not land where it should — {name} notes it but cannot resolve it without further entries.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} attends a Covenant lecture at {location}. The record it opens is one {they} {has not} read.',
      success:
        'The margin of the Covenant\'s copy fills. What is remembered is a little more exact.',
      failure:
        'A date that did not land. The note goes into {name}\'s own margin.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The lecture at {location} is in the record. {name}\'s copy has a careful second hand in its margins.',
        changes: [
          {
            id: 'lecture_attended',
            kind: 'reputation',
            title: 'Lecture Attended',
            detail: 'The Covenant\'s record has a new reader.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god notice in the margin?',
        reactions: [
          {
            id: 'lk.lecture.note',
            label: 'Enter what the lecture opened. Not everything learned in a hall needs to wait for a treatise.',
            intent:
              'You note the entry the lecture opened — a small record, but a real one. ' +
              'What {name} did not know before entering the hall is now in the margin.',
            effects: [
              {
                kind: 'intelligence' as const,
                category: 'cultural_knowledge',
                label: 'Lecture attendance — {location}',
                detail:
                  'Covenant lecture attended at {location}. Record opened that was previously unknown to {name}. ' +
                  'Key entry noted in second hand — available for citation in future work.',
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.lecture.pass',
            label: 'Let the lecture stand. The margin is enough.',
            intent: 'The lecture is in the record. The margin holds what it holds.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'lk.social.debate_forum',
    name: 'Debate Forum',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital', 'tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: LK_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The forum at {location} debates a contradicting account. {name} argues only from entries — what was said, what was not said, what the margin records as uncertain.',
        successAfterimage: 'The debate produces a note in the annal: both accounts held, both dated, the contradiction recorded.',
        failureAfterimage: 'The debate produces heat but no new entry. The Covenant notes only: forum held, record unchanged.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (LK_DIFFICULTY_BASE + LK_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          '{?has_faction}Covenant procedure{/has_faction}: the outcome of any forum is itself an entry. What was said. What was not said. The date.',
        successAfterimage: 'Entry made. The debate is now part of the record. {name}\'s hand is in the margin.',
        failureAfterimage: 'The entry is incomplete. A name is missing from one side of the debate. The Covenant will follow up.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} argues from the record at a forum in {location}. ' +
        'The Covenant\'s position: argue only from entries, not from interpretation.',
      success:
        'The debate produces a note in the annal. Both accounts held, both dated.',
      failure:
        'The debate produces heat but no new entry.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The forum at {location} is in the record. The debate produced either a note or the absence of one — the Covenant records both outcomes.',
        changes: [
          {
            id: 'debate_attended',
            kind: 'reputation',
            title: 'Forum Attended',
            detail: 'The Covenant argued from the record. The record is unchanged or enlarged.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the debate?',
        reactions: [
          {
            id: 'lk.debate.enter',
            label: 'Enter the debate as a record. Forums are events. Events belong in the annal.',
            intent:
              'You press the forum\'s outcome into the record — not who won, but that both accounts are now dated and held. ' +
              'The Covenant does not adjudicate debates. It records them.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.debate.pass',
            label: 'Let the forum stand. Not every argument changes the annal.',
            intent: 'The margin holds what it holds. The debate is entered as held.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'lk.social.manuscript_exchange',
    name: 'Manuscript Exchange',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital', 'tower', 'town'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: LK_DIFFICULTY_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          '{name} brings a duplicate entry to the exchange at {location}{?has_faction} on behalf of the Covenant{/has_faction}. A duplicate freely given is a small hole closed in another collection.' +
          '{?has_artifact} {artifact:any} raises the exchange value considerably — the other hand has something worth trading for a manuscript of that caliber.{/has_artifact}' +
          '{?no_artifact} Without a notable artifact to sweeten the exchange, the offer stands on the Covenant\'s name alone.{/no_artifact}',
        successAfterimage: 'The exchange goes both ways. A gap in the Covenant\'s annal closes.',
        failureAfterimage: 'The offered entry is not what the other hand needs. The exchange closes without a new record on either side.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} brings a duplicate to a manuscript exchange at {location}. A gap on another shelf might close. The Covenant\'s gap might close too.',
      success:
        'The exchange goes both ways. A gap in the Covenant\'s annal closes.',
      failure:
        'The offered entry is not what the other hand needs. No new record on either side.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The exchange at {location} closed — or did not. The Covenant notes the outcome with the date and the hand that attended.',
        changes: [
          {
            id: 'manuscript_exchanged',
            kind: 'reputation',
            title: 'Manuscript Exchange',
            detail: 'A gap in the Covenant\'s annal may have closed. The exchange is entered.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the exchange?',
        reactions: [
          {
            id: 'lk.manu.record',
            label: 'Enter what was received. An exchange that closes a gap is worth a dated entry.',
            intent:
              'You enter what the Covenant received — not the object, but the entry it filled. ' +
              'A gap the annal has held for a generation is closed now.',
            effects: [
              {
                kind: 'intelligence' as const,
                category: 'cultural_knowledge',
                label: 'Manuscript exchange — {location}',
                detail:
                  'Exchange conducted at {location} — gap in the Covenant\'s annal filled by incoming manuscript. ' +
                  'Outgoing duplicate transferred to partner collection. Both holdings updated.',
              },
              { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
              { kind: 'reputation_tally' as const, key: 'gold.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.manu.seed',
            label: 'Mark the gap that could not close. The right manuscript is somewhere — and worth finding.',
            intent:
              'The exchange failed because the Covenant does not yet hold what the other hand needs. ' +
              'You mark the gap for a future recovery mission.',
            effects: [
              {
                kind: 'encounter_seed' as const,
                templateId: 'lk.quest.recover_tome',
                delayTicks: FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS,
                seedLabel: 'Manuscript exchange at {location} failed — the needed volume must be recovered',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lk.manu.pass',
            label: 'Let the exchange stand as entered.',
            intent: 'The outcome is in the record. The annal holds what it holds.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Lifecycle Templates ──────────────────────────────────────────────────

export const LK_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'lk.join',
  name: 'Join the Lorekeepers Covenant',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  reach: 'eye',
  crudType: 'update',
  scale: 'local',
  locationSubtypes: ['city', 'capital', 'tower'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
  steps: [
    {
      reach: 'eye',
      duration: { min: 1, max: 2 },
      difficulty: LK_JOIN_DIFFICULTY / 100,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        '{name} presents a record at {location} — something observed, precisely noted, with the date in the margin and the hand identified. The Covenant reads it for what was said and what was not said.',
      successAfterimage: 'The record is accepted into the annal. The Covenant opens a new entry for {name}\'s hand.',
      failureAfterimage: 'The record has opinion in the margin. The Covenant asks {name} to remove the conclusion and return with what was observed.',
    },
    {
      reach: 'eye',
      duration: { min: 1, max: 1 },
      difficulty: (LK_JOIN_DIFFICULTY + LK_DIFFICULTY_STEP) / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        '{?has_faction}The Covenant{/has_faction} trains a second hand — a learned script, distinct from personal writing. Every entry {name} makes will carry it.',
      successAfterimage: 'The second hand is accepted. {name}\'s first official entry closes with the date and the hand. What is remembered will be remembered correctly.',
      failureAfterimage: 'The second hand is not yet clean. The Covenant gives {name} a practice volume and asks them to fill a hundred pages before returning.',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name} presents a record to the Covenant — something observed, precisely noted, with the date in the margin and the hand identified.',
    success:
      '{name}\'s hand enters the annal. The Covenant is warm about this.',
    failure:
      'Opinion in the margin. The Covenant asks {name} to return with what was observed.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        '{name} is in the Covenant now — or has been asked to return with a cleaner record. ' +
        'The Covenant\'s welcome is precise: it opens when the margin is clean.',
      changes: [
        {
          id: 'lk_join_rep',
          kind: 'faction_reputation',
          title: 'Covenant Member',
          detail: '{name}\'s hand is now part of the annal.',
          polarity: 'gain',
        },
      ],
      reactionPrompt: 'What does the god press into the first entry?',
      reactions: [
        {
          id: 'lk.join.steady',
          label: 'Steady the first margin. A first entry shapes the hand that follows.',
          intent:
            'You steady {name}\'s second hand — the Covenant\'s script, distinct from personal writing. ' +
            'Every entry {they} make{s} will carry it now.',
          effects: [
            { kind: 'faction_reputation_gain' as const, factionId: 'lorekeepers_covenant', amount: 0.1 },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'lk.join.pass',
          label: 'Let the welcome stand. The Covenant has its new scribe.',
          intent: 'The entry is made. The Covenant is warm about this — in its precise way.',
          effects: [
            { kind: 'faction_reputation_gain' as const, factionId: 'lorekeepers_covenant', amount: 0.05 },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const LK_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'lk.promotion',
  name: 'Promotion in the Lorekeepers Covenant',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  reach: 'eye',
  crudType: 'update',
  scale: 'local',
  locationSubtypes: ['city', 'capital', 'tower'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
  steps: [
    {
      reach: 'eye',
      duration: { min: 1, max: 2 },
      difficulty: LK_PROMOTION_DIFFICULTY / 100,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        'The Covenant reviews {name}\'s contributions to the annal. Not the quantity — the precision. Were dates fixed? Were contradictions between accounts noted, not resolved?',
      successAfterimage: 'The body of work is accepted. Every margin is clean. Every date lands where it should.',
      failureAfterimage: 'One entry has a date that does not land. The Covenant asks {name} to correct it and return.',
    },
    {
      reach: 'eye',
      duration: { min: 1, max: 1 },
      difficulty: (LK_PROMOTION_DIFFICULTY + LK_DIFFICULTY_STEP) / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        'The new rank{?has_faction} within the Covenant{/has_faction} carries a new section of the annal to maintain. More entries. More margins. More of what is remembered.',
      successAfterimage: 'The section is assigned. {name}\'s hand will be in these margins for a generation. The Covenant is warm about this.',
      failureAfterimage: 'The new section is larger than {name} expected. The Covenant says: that is always true of the next rank.',
    },
  ],
  narrativeTemplates: {
    initiation:
      'The Covenant reviews {name}\'s contributions to the annal. Not the quantity — the precision.',
    success:
      'The section is assigned. {name}\'s hand will be in these margins for a generation.',
    failure:
      'The new section is larger than {name} expected. That is always true of the next rank.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        '{name} holds a new section of the annal now — or has been sent back to correct one entry before returning. ' +
        'The Covenant is warm about promotion, in the way the Covenant is warm about anything: precisely.',
      changes: [
        {
          id: 'lk_promotion_rep',
          kind: 'faction_reputation',
          title: 'Covenant Promotion',
          detail: '{name}\'s rank is confirmed. A new section of the annal is {their} responsibility.',
          polarity: 'gain',
        },
      ],
      reactionPrompt: 'What does the god press into the new section?',
      reactions: [
        {
          id: 'lk.promo.steady',
          label: 'Steady the promotion. The Covenant\'s warmth is precise — press it in.',
          intent:
            'You steady the moment — new rank, new section, the Covenant\'s particular warmth for those ' +
            'who have earned a larger margin to maintain.',
          effects: [
            { kind: 'faction_reputation_gain' as const, factionId: 'lorekeepers_covenant', amount: 0.2 },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'lk.promo.pass',
          label: 'Let the promotion stand. The section is {name}\'s. That is enough.',
          intent: 'The section is assigned. The Covenant has what it needs. So does {name}.',
          effects: [
            { kind: 'faction_reputation_gain' as const, factionId: 'lorekeepers_covenant', amount: 0.1 },
          ],
          closeAfterSelection: true,
        },
      ],
    },
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
