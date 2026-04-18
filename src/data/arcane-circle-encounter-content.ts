/**
 * Arcane Circle Encounter Content — migrated to UnifiedActionTemplate (THR-91).
 *
 * Quest, social, join, and promotion templates for the arcane circle.
 * All 15 legacy EncounterTemplate entries rewritten to UnifiedActionTemplate
 * format with Threadbare-aesthetic prose, enrichment placeholders, and
 * contextual aftermath (encounter seeds, hidden marks, intelligence grants,
 * reputation tallies). Arcane Circle voice: wonder + obsession, beauty at the
 * edge of dangerous knowledge.
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';

// ─── Constants ───────────────────────────────────────────────────────────

const AC_DIFFICULTY_BASE = 30;
const AC_DIFFICULTY_STEP = 10;
const AC_SENIOR_BASE = 45;
const AC_ELITE_BASE = 60;
const AC_JOIN_DIFFICULTY = 25;
const AC_PROMOTION_DIFFICULTY = 40;
/** Social / background encounter difficulty: AC_DIFFICULTY_BASE − 5 */
const AC_SOCIAL_DIFFICULTY = AC_DIFFICULTY_BASE - 5;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const ARCANE_CIRCLE_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  // Join & Promotion
  ['ac.join', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.0, questType: 'standard' }],
  ['ac.promotion', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.0, questType: 'standard' }],
  // Standard quests
  ['ac.quest.ley_survey', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['ac.quest.reagent_gather', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['ac.quest.ward_inspection', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['ac.quest.translate_tome', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.05, questType: 'standard' }],
  ['ac.quest.anomaly_report', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.05, questType: 'standard' }],
  // Senior quests
  ['ac.senior.planar_probe', { factionDefId: 'arcane_circle', minRank: 'magister', reputationReward: 0.06, questType: 'senior' }],
  ['ac.senior.enchant_artifact', { factionDefId: 'arcane_circle', minRank: 'magister', reputationReward: 0.06, questType: 'senior' }],
  ['ac.senior.ruin_expedition', { factionDefId: 'arcane_circle', minRank: 'magister', reputationReward: 0.06, questType: 'senior' }],
  // Elite quests
  ['ac.elite.arcane_thesis', { factionDefId: 'arcane_circle', minRank: 'archmage', reputationReward: 0.08, questType: 'elite' }],
  ['ac.elite.seal_the_breach', { factionDefId: 'arcane_circle', minRank: 'archmage', reputationReward: 0.08, questType: 'elite' }],
  // Social encounters
  ['ac.social.lecture_hall', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
  ['ac.social.spell_exchange', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
  ['ac.social.library_browse', { factionDefId: 'arcane_circle', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Templates ───────────────────────────────────────────────────────────

export const ARCANE_CIRCLE_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [
  // ── Standard Quests (Apprentice+) ──────────────────────────────────

  {
    id: 'ac.quest.ley_survey',
    name: 'Ley Line Survey',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'veil',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['city', 'capital', 'tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'veil',
        duration: { min: 2, max: 2 },
        difficulty: AC_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The circle\'s detection instruments are old things — brass fittings, ' +
          'crystal lenses clouded with years of calibration residue — but they are ' +
          'precise when {name} takes the time to do this properly. {they} work{s} ' +
          'through the alignment sequence in the survey room at {location}, ' +
          'turning each adjustment by feel rather than formula. ' +
          '{?has_artifact}{artifact:any} sits beside the instruments, and {name} ' +
          'finds {they} keep{s} reaching for it instinctively — old habits of magical ' +
          'attunement running ahead of the official procedure.{/has_artifact}' +
          '{?no_artifact}The instruments resist, as they always do for those who ' +
          'haven\'t learned to ask them politely.{/no_artifact}',
        successAfterimage: 'A clean resonance hum. The instruments are ready to map.',
        failureAfterimage: 'The calibration drifts. The readings will carry error.',
      },
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: (AC_DIFFICULTY_BASE + AC_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
            tagFilters: ['#veil'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.80, possession: 0.20 } },
        },
        narrativeTemplate:
          '{name} walks the survey route, instruments extended, watching the needle ' +
          'as it traces ley current through the ground beneath {location}. ' +
          'The readings hold steady at first — clean, geometric, the kind of pattern ' +
          'that makes junior surveyors smile. Then, at the third marker, something ' +
          'shifts. The geometry is still there, but it\'s folded wrong, like a page ' +
          'turned backwards in a book no one was meant to read. {name} marks the ' +
          'anomaly carefully and keeps walking.',
        successAfterimage: 'A complete ley map — and an anomaly the circle will want explained.',
        failureAfterimage: 'Interference corrupts the readings. The map has gaps where answers should be.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} takes the circle\'s detection instruments and walks {location}\'s ' +
        'survey route, mapping the ley currents that run beneath the streets. ' +
        'Routine work, mostly. Mostly.',
      success:
        'A complete map and a question. The circle updates its charts and opens a new file.',
      failure:
        'Interference. The readings are partial, and the anomaly {name} glimpsed ' +
        'is now documented only as a smear on an incomplete graph.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} returns the instruments and files the survey. The ley currents ' +
          'beneath {location} are recorded, updated, and — if the anomaly at the ' +
          'third marker holds — potentially concerning. The circle doesn\'t know yet ' +
          'what {name} found, or whether it matters.',
        changes: [
          {
            id: 'ley_survey_knowledge',
            kind: 'item',
            title: 'Survey Record',
            detail: 'Updated ley readings for the region, with one unexplained deviation.',
            polarity: 'gain',
          },
          {
            id: 'ley_survey_anomaly',
            kind: 'future_hook',
            title: 'The Third Marker',
            detail: 'Something in the ley geometry doesn\'t resolve cleanly. It may be noise. It may not be.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The survey is complete. What does the god see in the deviation?',
        reactions: [
          {
            id: 'ley_survey_file_intel',
            label: 'The anomaly is worth remembering.',
            intent:
              'The ley deviation at the third marker was small, but small deviations ' +
              'in stable geometries are how the circle learns where the interesting ' +
              'things are hiding. The god preserves the detail.',
            effects: [
              {
                kind: 'intelligence',
                category: 'arcane_site',
                label: 'Ley deviation at survey marker, {location}',
                detail:
                  'The geometry folds at a specific point — not corrupted, just wrong in an interesting way. ' +
                  'Consistent readings would confirm a convergence point or a disturbance.',
                reliability: 0.75,
              },
              { kind: 'reputation_tally', key: 'ac.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ley_survey_seed_investigation',
            label: 'Something is coming through that fold.',
            intent:
              'Ley geometry doesn\'t fold by accident. What {name} marked at the ' +
              'third marker is either a natural convergence or a deliberate working — ' +
              'and natural convergences don\'t shift mid-survey.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'ac.quest.anomaly_report',
                delayTicks: 10,
                seedLabel: 'The ley deviation at the third marker requires a dedicated investigation',
              },
              { kind: 'reputation_tally', key: 'ac.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ac.quest.reagent_gather',
    name: 'Gather Arcane Reagents',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'veil',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['city', 'capital', 'tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: AC_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The formulary is kept in the circle\'s reference room — a narrow shelf of ' +
          'bound volumes, each one annotated by a different hand across a century of use. ' +
          '{name} works through the relevant entries, cross-referencing what the circle ' +
          'needs with what {location}\'s suppliers actually carry. Some of the required ' +
          'components have three acceptable substitutions; one has none. ' +
          '{?has_faction}The circle\'s procurement contacts can source the difficult ' +
          'ingredient if the request goes through the right channel — which {name} knows, ' +
          'because {they} read{s} the internal directory.{/has_faction}' +
          '{?no_faction}{name} works from the public formulary alone. ' +
          'The difficult ingredient will take longer to find.{/no_faction}',
        successAfterimage: 'Sources mapped, substitutions flagged, the difficult ingredient located.',
        failureAfterimage:
          'The formulary is ambiguous on three components. Some guesswork will be required.',
      },
      {
        reach: 'veil',
        duration: { min: 2, max: 2 },
        difficulty: (AC_DIFFICULTY_BASE + AC_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.20, bestowed_power: 0.20 },
            tagFilters: ['#veil'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.70, possession: 0.30 } },
        },
        narrativeTemplate:
          'The apothecary quarter of {location} is a particular kind of smell — dried flowers ' +
          'and something sharper underneath, the chemical scent of things that shouldn\'t touch. ' +
          '{name} works through the supplier list methodically. Most of it is straightforward. ' +
          'The difficult reagent — the one that has no substitution — is at the last address, ' +
          'held behind the counter in a sealed case the proprietor produces with the particular ' +
          'ceremony of someone who charges accordingly.',
        successAfterimage:
          'Every component acquired. The circle\'s stores are replenished, the difficult reagent secured.',
        failureAfterimage:
          'Three components found, but the difficult reagent is out of stock until next season.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} consults the formulary and sets out into {location} to gather what ' +
        'the circle needs. Supply runs are the least glamorous part of magical practice ' +
        'and the most essential.',
      success: 'Everything on the list, including the difficult one. The circle\'s stores are full.',
      failure: 'Most of the components, but not all. The critical shortage remains.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} returns to the circle with what {they} found{s}. The stores are ' +
          'replenished or they aren\'t — but the suppliers of {location} have been ' +
          'assessed, and the difficult reagent\'s provenance is now known.',
        changes: [
          {
            id: 'reagent_supply_state',
            kind: 'item',
            title: 'Reagent Supply',
            detail: 'The circle\'s stores, updated. One component may remain scarce.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god note from the procurement run?',
        reactions: [
          {
            id: 'reagent_gather_supply_intel',
            label: 'The supplier network is worth knowing.',
            intent:
              'Who carries what, at what price, and who can source the unusual components — ' +
              'this is operational knowledge the circle values. The god marks the network.',
            effects: [
              {
                kind: 'intelligence',
                category: 'trade_route',
                label: 'Reagent supply contacts in {location}',
                detail:
                  'Apothecary sources, specialty suppliers, and at least one who handles ' +
                  'components that don\'t appear in the public formulary.',
                reliability: 0.8,
              },
              { kind: 'reputation_tally', key: 'ac.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'reagent_gather_release',
            label: 'The circle is supplied. Nothing more.',
            intent: 'Stores filled, task complete. The god releases the thread.',
            effects: [
              { kind: 'reputation_tally', key: 'ac.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ac.quest.ward_inspection',
    name: 'Ward Inspection',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'veil',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['city', 'capital', 'tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'veil',
        duration: { min: 2, max: 2 },
        difficulty: (AC_DIFFICULTY_BASE + 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Wards degrade in predictable ways unless something unpredictable is happening ' +
          'to them. {name} begins the inspection at the tower\'s outermost layer, running ' +
          '{their} attention along each warding thread the way a carpenter checks a joint ' +
          'for play — not looking for the obvious failures, but for the small yielding ' +
          'that precedes them. ' +
          '{?has_artifact}{artifact:any} amplifies the detection range, and {name} uses ' +
          'it without asking permission — the inspection will be faster, and faster means ' +
          'more thorough before the shift changes.{/has_artifact}' +
          '{?no_artifact}Manual detection means close work, which means {name} will ' +
          'learn more than the instruments would show — and miss less.{/no_artifact}',
        successAfterimage: 'Three weak points located and logged. Reinforcement is a matter of technique.',
        failureAfterimage:
          'The ward matrix is complex enough that several sections resist clean reading.',
      },
      {
        reach: 'veil',
        duration: { min: 2, max: 2 },
        difficulty: (AC_DIFFICULTY_BASE + AC_DIFFICULTY_STEP + 5) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'Reinforcing a ward properly requires understanding why it weakened, not just ' +
          'patching the visible gap. {name} works backward from each failure point, ' +
          'tracing the degradation to its source. In two cases it\'s ordinary decay — ' +
          'time and flux, nothing sinister. The third point is different. The thread ' +
          'there didn\'t weaken; it was tested. Deliberately, carefully, and recently.',
        successAfterimage:
          'The wards are restored. The tower is secure again — and someone has been checking its defenses.',
        failureAfterimage:
          'The patches hold but the underlying structure resists full restoration. ' +
          'The third point remains a question.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} runs the regular inspection of {location}\'s circle wards — ' +
        'routine maintenance that only becomes interesting when something isn\'t routine.',
      success:
        'Wards reinforced, tower secured, and a note in the inspection file ' +
        'that the third failure point didn\'t fail on its own.',
      failure:
        'Patched, not fixed. The structure is fragile where it matters, ' +
        'and the third point is still unexplained.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The ward inspection is complete. Whatever state the wards are in, ' +
          '{name} has seen something at the third failure point that doesn\'t ' +
          'belong in a routine degradation report — a deliberate test, or something ' +
          'that wanted in and checked whether it could.',
        changes: [
          {
            id: 'ward_inspection_status',
            kind: 'reputation',
            title: 'Ward Integrity',
            detail: 'Reinforced or patched — the tower\'s defenses are updated.',
            polarity: 'gain',
          },
          {
            id: 'ward_inspection_probe',
            kind: 'future_hook',
            title: 'The Third Point',
            detail: 'Something tested the ward at a specific location. Deliberately, recently.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The ward was tested from outside. What does the god do with that knowledge?',
        reactions: [
          {
            id: 'ward_inspection_mark_threat',
            label: 'Something has been watching this tower.',
            intent:
              'Ward probing is intelligence-gathering before entry. Whatever tested that ' +
              'third point knows the tower\'s layout well enough to target the right thread. ' +
              'The god marks the incursion attempt.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.5,
                label:
                  'Circle tower ward probed at third inspection point — external, deliberate, recent',
                revealFamilies: ['ac.quest', 'investigation'],
              },
              {
                kind: 'encounter_seed',
                encounterFamily: 'ac.quest',
                delayTicks: 15,
                seedLabel: 'The ward probing at {location} suggests someone is preparing an approach',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ward_inspection_report_only',
            label: 'Log it. Watch it.',
            intent:
              'One anomalous data point doesn\'t confirm a threat. The god notes ' +
              'the discrepancy and keeps a thread on whether it recurs.',
            effects: [
              { kind: 'reputation_tally', key: 'ac.tower_security', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ac.quest.translate_tome',
    name: 'Translate an Ancient Tome',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['city', 'capital', 'tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        reach: 'eye',
        duration: { min: 3, max: 3 },
        difficulty: (AC_DIFFICULTY_BASE + 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The text is old in a way that makes {name} reconsider the catalog date — ' +
          'the ink composition is wrong for the listed period, and the scribal hand ' +
          'uses a ligature that the academic consensus believes fell out of use two ' +
          'centuries earlier than this volume should have been written. ' +
          '{name} sets it under better light and begins at the beginning, building ' +
          'a vocabulary from context and cognates before attempting anything else. ' +
          '{?has_ally}The question of who else {ally:strongest} knows who reads ' +
          'this language surfaces and is set aside — {name} wants to work this ' +
          'alone first, before the interpretation becomes collaborative.{/has_ally}' +
          '{?no_ally}Alone is slower. It is also cleaner.{/no_ally}',
        successAfterimage: 'The script resolves. The language is old but consistent.',
        failureAfterimage:
          'The grammar resists a clean reading. Core passages remain opaque.',
      },
      {
        reach: 'veil',
        duration: { min: 2, max: 2 },
        difficulty: (AC_DIFFICULTY_BASE + AC_DIFFICULTY_STEP + 5) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.20, bestowed_power: 0.30 },
            tagFilters: ['#veil'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.05,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.70, possession: 0.30 } },
        },
        narrativeTemplate:
          'Translation and interpretation are different skills, and the gap between ' +
          'them opens widest in texts like this one. The words are clear now. ' +
          'What they describe is a working — a specific, detailed, functional working ' +
          'for a purpose that the academic community believes was abandoned as ' +
          'theoretical before anyone attempted it in practice. {name} finishes ' +
          'the translation and sits with the completed document for a long moment ' +
          'before deciding how to categorize it in the circle\'s registry.',
        successAfterimage:
          'A complete translation. What the tome describes is functional. ' +
          'And not what the circle was expecting to find.',
        failureAfterimage:
          'The key technical sections resist interpretation. ' +
          'The working described inside remains partially illegible.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} takes on the translation of a tome the circle received from ' +
        'an estate auction — old, improperly cataloged, possibly significant. ' +
        'Possibly something else entirely.',
      success:
        'Complete. The circle has gained knowledge and a question: ' +
        'who wrote this, and why did they hide it in a collection of cookbooks.',
      failure:
        'Partial. The working inside is described in outline but not in detail. ' +
        'Enough to know it exists. Not enough to attempt it.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The translation is filed with the circle\'s acquisition office. ' +
          'Whether it\'s complete or partial, the tome has been read now — ' +
          'and what {name} found inside doesn\'t quite match what a routine ' +
          'acquisition report is designed to capture.',
        changes: [
          {
            id: 'tome_translation_knowledge',
            kind: 'item',
            title: 'Translated Text',
            detail:
              'A functional working, described in full or in part, ' +
              'that someone went to considerable trouble to obscure.',
            polarity: 'gain',
          },
          {
            id: 'tome_translation_provenance',
            kind: 'future_hook',
            title: 'Authorship',
            detail:
              'The text is older than it should be. The scribal hand is ' +
              'from a tradition that shouldn\'t have known this working. Someone knows why.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The tome has been read. What does the god do with what it contained?',
        reactions: [
          {
            id: 'tome_translate_record_knowledge',
            label: 'File the working. It may matter later.',
            intent:
              'A functional working of the type this describes would have ' +
              'significant consequences if attempted. The god marks the knowledge — ' +
              'not acted on, but not forgotten.',
            effects: [
              {
                kind: 'intelligence',
                category: 'arcane_site',
                label: 'Functional working — translation filed at {location} circle',
                detail:
                  'A working the academic consensus believes was purely theoretical, ' +
                  'described in sufficient detail to suggest the author had tested it.',
                reliability: 0.9,
              },
              { kind: 'reputation_tally', key: 'ac.scholarship', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'tome_translate_mark_dangerous',
            label: 'This knowledge is a liability.',
            intent:
              '{name} now knows something that the circle did not intend to acquire ' +
              'when it bought this estate lot. Knowledge of this kind doesn\'t stay ' +
              'contained. Other things come looking for it.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: 0.55,
                label:
                  '{name} has translated a text describing a working of unclear purpose and considerable power',
                revealFamilies: ['ac.quest', 'investigation'],
              },
              {
                kind: 'encounter_seed',
                encounterFamily: 'ac.quest',
                delayTicks: 20,
                seedLabel:
                  'Someone else is looking for this tome — and they\'ve learned that the circle has it',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ac.quest.anomaly_report',
    name: 'Investigate Arcane Anomaly',
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
        duration: { min: 2, max: 2 },
        difficulty: AC_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The disturbance in {location}\'s magical field isn\'t sound exactly — ' +
          'it\'s the absence where sound should be, a pocket of stillness that moves ' +
          'when {name} isn\'t looking directly at it. {they} set{s} up observation ' +
          'at the reported epicenter and begins cataloguing. The instruments confirm ' +
          'what {their} perception suggested: the field is compressed at a specific ' +
          'depth, not corrupted, not damaged — held. Something is holding it closed ' +
          'from the inside. ' +
          '{?has_faction}The circle\'s anomaly files have three similar reports from ' +
          'the last decade. Two resolved naturally. One didn\'t.{/has_faction}' +
          '{?no_faction}No reference material on hand. {name} works from first principles.{/no_faction}',
        successAfterimage: 'The anomaly is catalogued — location, depth, apparent cause, behavior.',
        failureAfterimage:
          'The disturbance is erratic, moving when observed. No stable pattern emerges.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: (AC_DIFFICULTY_BASE + AC_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
            tagFilters: ['#eye'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.05,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.80, possession: 0.20 } },
        },
        narrativeTemplate:
          'Writing up an anomaly report for the circle\'s files requires a particular ' +
          'discipline: describe what was observed, not what {name} suspects it implies. ' +
          'The compressed field. The depth. The movement that may or may not be intentional. ' +
          '{they} write{s} it cleanly, without interpretation, ' +
          'and files it under Unexplained — Category Three, which means ' +
          'it will sit in the queue for someone senior to review, ' +
          'unless {name} flags it for immediate attention, which {they\'s} considering.',
        successAfterimage:
          'Thorough documentation. The magister reads it and schedules a review for the following week.',
        failureAfterimage:
          'The report lacks the precision the circle\'s standards require. More field data is needed.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} investigates a disturbance in {location}\'s magical field ' +
        'and files the report that will determine whether anyone else looks into it.',
      success:
        'Filed under Category Three, flagged for immediate review. ' +
        'The anomaly has been seen and documented. Whether it\'s been understood is another question.',
      failure:
        'The report exists, but the data is thin. The anomaly is catalogued ' +
        'as insufficient for review, which may not be an accurate characterization.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The anomaly report sits in the circle\'s review queue. ' +
          'The field disturbance in {location} continues, or it doesn\'t — ' +
          'the report only captures what was observed, not what comes next.',
        changes: [
          {
            id: 'anomaly_report_filed',
            kind: 'item',
            title: 'Anomaly Report',
            detail: 'Filed with the circle. A disturbance documented and queued for senior review.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'The anomaly has been observed. What does the god see that the report won\'t say?',
        reactions: [
          {
            id: 'anomaly_report_seed_investigation',
            label: 'The circle review won\'t catch this in time.',
            intent:
              'Category Three means weeks before anyone senior looks at it. ' +
              'The field compression {name} observed isn\'t stable — it\'s building. ' +
              'The god marks this as an active problem, not a queued one.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'ac.senior.planar_probe',
                delayTicks: 12,
                seedLabel: 'The anomaly at {location} develops into something the circle can\'t ignore',
              },
              { kind: 'reputation_tally', key: 'ac.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'anomaly_report_trust_queue',
            label: 'The circle has processes. Trust them.',
            intent:
              'The report is filed. Senior mages will review it. ' +
              'The god observes and does not intervene in institutional procedure.',
            effects: [
              { kind: 'reputation_tally', key: 'ac.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── Senior Quests (Magister+) ─────────────────────────────────

  {
    id: 'ac.senior.planar_probe',
    name: 'Planar Probe',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'veil',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['capital', 'tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    description:
      'A controlled reach across the planar boundary — observing what lies adjacent ' +
      'to the world without opening anything that needs to stay closed. ' +
      'In theory. The theory has survived most attempts.',
    steps: [
      {
        reach: 'veil',
        duration: { min: 2, max: 2 },
        difficulty: AC_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Probing another plane requires geometry that doesn\'t shift and ' +
          'power that doesn\'t pulse — a still pool, not a current. {name} ' +
          'draws the ritual circle in the designated chamber of the tower at {location}, ' +
          'measuring each line three times before committing the chalk to stone. ' +
          'The math is settled theory; the execution is where planar probes go wrong. ' +
          '{?has_artifact}{artifact:any} sits at the circle\'s edge, and {name} considers ' +
          'using it to anchor the focal point — the risk is resonance contamination, ' +
          'but the stability gain would be significant.{/has_artifact}' +
          '{?no_artifact}Standard configuration. The geometry should hold unless ' +
          'something on the other side decides to lean.{/no_artifact}',
        successAfterimage:
          'The circle is drawn. The focal point holds steady. Ready for contact.',
        failureAfterimage:
          'The geometry is off by a fraction that shouldn\'t matter and does. ' +
          'The probe will attempt from an unstable position.',
      },
      {
        reach: 'veil',
        duration: { min: 3, max: 3 },
        difficulty: (AC_SENIOR_BASE + AC_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.20, bestowed_power: 0.50 },
            tagFilters: ['#veil'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.06,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.80, possession: 0.20 } },
        },
        narrativeTemplate:
          '{name} extends {their} awareness across the planar boundary — not entering, ' +
          'not opening, just looking. The adjacent plane resolves in partial images: ' +
          'geometry that has nothing to do with space, colors that don\'t have names in ' +
          'any language {they\'ve} studied{s}, and something that becomes aware of ' +
          'the looking a moment after {name} begins. It doesn\'t approach. ' +
          'It simply waits, with the patience of something that has no concept of time, ' +
          'to see what {name} does next.',
        successAfterimage:
          'Contact made. Data returns. And something on the other side has taken note.',
        failureAfterimage:
          'The probe destabilizes and collapses inward. {name} pulls back intact, ' +
          'but the connection lasted long enough for notice.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} prepares a planar probe — controlled, bounded, documented. ' +
        'The circle knows what {they\'re} doing. What waits across the boundary does not need to.',
      success:
        'Data streams back. The circle\'s knowledge of adjacent planar geometry expands. ' +
        'Something across the boundary now knows this tower\'s position.',
      failure:
        'The probe collapses before full contact. {name} surfaces intact, with fragments — ' +
        'and the distinct impression that whatever noticed the probe is still watching.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The probe is complete or collapsed. Either way, {location}\'s tower ' +
          'has pushed across the planar boundary and something there has registered it. ' +
          'The circle has new data or partial data. Both outcomes carry the same coda: ' +
          'the observation ran in both directions.',
        changes: [
          {
            id: 'planar_probe_knowledge',
            kind: 'item',
            title: 'Planar Data',
            detail: 'Observations from adjacent space — geometry, activity, awareness levels.',
            polarity: 'gain',
          },
          {
            id: 'planar_probe_attention',
            kind: 'future_hook',
            title: 'Observed in Return',
            detail:
              'Something across the boundary noticed the probe. ' +
              'Whether it acts on that knowledge is not yet determined.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The boundary was crossed, briefly. What does the god read in what returned?',
        reactions: [
          {
            id: 'planar_probe_file_data',
            label: 'The observation is valuable. File it.',
            intent:
              'Planar data of this specificity is rare. The god marks the ' +
              'intelligence — what the probe saw, where attention was held, ' +
              'what the adjacent geometry suggests about the boundary\'s current stability.',
            effects: [
              {
                kind: 'intelligence',
                category: 'arcane_site',
                label: 'Planar probe results — {location} tower, adjacent boundary',
                detail:
                  'Geometric data, activity signatures, awareness presence. ' +
                  'The boundary is stable but occupied.',
                reliability: 0.85,
              },
              { kind: 'reputation_tally', key: 'ac.advanced_research', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'planar_probe_mark_noticed',
            label: 'Something knows this tower\'s location now.',
            intent:
              'The planar entity that registered the probe didn\'t act. ' +
              'That\'s patience, not indifference. The god marks the exposure ' +
              'and the future consequence it implies.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.65,
                label:
                  'Tower at {location} registered by adjacent planar entity during probe — awareness confirmed',
                revealFamilies: ['ac.senior', 'ac.elite', 'investigation'],
              },
              {
                kind: 'encounter_seed',
                templateId: 'ac.elite.seal_the_breach',
                delayTicks: 25,
                seedLabel:
                  'The planar entity that noted the probe begins testing the boundary near {location}',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ac.senior.enchant_artifact',
    name: 'Enchant an Artifact',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'veil',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: ['city', 'capital', 'tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        reach: 'veil',
        duration: { min: 2, max: 2 },
        difficulty: AC_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The object {name} has been given to enchant is unremarkable — a clasp, ' +
          'a ring, a small blade, something that nobody would think to search. ' +
          '{they} begin{s} the purification sequence in the workshop at {location}, ' +
          'working through the prescribed steps with enough care that each one ' +
          'consumes real attention. Purification isn\'t cleaning. It\'s making the ' +
          'object forget what it was, so it can become something else. ' +
          '{?has_artifact}{artifact:any} hums faintly in {their} pack — ' +
          'already enchanted, already opinionated — and {name} keeps it away ' +
          'from the work surface.{/has_artifact}' +
          '{?no_artifact}Clean hands, clear workspace, no competing resonances.{/no_artifact}',
        successAfterimage: 'The vessel is ready. No impurities, no residual signature.',
        failureAfterimage:
          'Trace impurities persist in the matrix. The enchantment may bind imperfectly.',
      },
      {
        reach: 'veil',
        duration: { min: 3, max: 3 },
        difficulty: (AC_SENIOR_BASE + AC_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.20, bestowed_power: 0.40 },
            tagFilters: ['#veil'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.06,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.70, possession: 0.30 } },
        },
        narrativeTemplate:
          'Laying spell patterns is like writing in a language that requires the writer ' +
          'to also be the pen. {name} works slowly, building the enchantment layer by ' +
          'layer — not the functional specifications, which are documented and simple enough, ' +
          'but the intent behind them. Enchantments that work as described and no further ' +
          'are the safe kind. The kind that do exactly what {name} means, precisely and ' +
          'completely, are rarer and require that {name} know what {they} mean{s}.',
        successAfterimage:
          'The enchantment holds. The object is changed in the specific, permanent way ' +
          'that distinguishes craft from hoping.',
        failureAfterimage:
          'The patterns collapse at the final bind. The object cracks from the sudden ' +
          'release — not destroyed, but marked.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} purifies a vessel and weaves the prescribed enchantment at ' +
        '{location}\'s workshop. Precision work. The kind that either holds completely or doesn\'t hold at all.',
      success:
        'A new magical artifact, made to specification, carrying the intent {name} ' +
        'built into it. The circle adds it to the acquisition register.',
      failure:
        'The vessel cracked at the final bind. The work is lost, and the object ' +
        'carries a failed enchantment like a scar.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The enchantment is complete or it isn\'t. Either way, the workshop ' +
          'at {location} has processed another commission, and {name} has ' +
          'learned something about the gap between instruction and understanding.',
        changes: [
          {
            id: 'enchant_artifact_product',
            kind: 'item',
            title: 'Enchanted Object',
            detail: 'A functional magical artifact, or a cracked vessel with a failed working inside.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'The enchantment is done. What does the god mark in the making of it?',
        reactions: [
          {
            id: 'enchant_artifact_commission_note',
            label: 'Note who this was made for.',
            intent:
              'An enchanted object moves through the world and changes hands and ' +
              'changes situations. The god marks the commission — who asked, ' +
              'what was made, what the intended purpose was.',
            effects: [
              {
                kind: 'intelligence',
                category: 'agent_network',
                label: 'Enchantment commission — object made for recipient at {location}',
                detail:
                  'Specifications, intended purpose, recipient. ' +
                  'Useful if the object surfaces later under different circumstances.',
                reliability: 0.8,
              },
              { kind: 'reputation_tally', key: 'ac.enchantment_craft', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'enchant_artifact_release',
            label: 'The work is done. Release it.',
            intent: 'Made and delivered. The god does not track what it does next.',
            effects: [
              { kind: 'reputation_tally', key: 'ac.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ac.senior.ruin_expedition',
    name: 'Arcane Ruin Expedition',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['city', 'capital', 'tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    description:
      'An ancient arcane site, recently located, with records that don\'t agree on ' +
      'what it was used for. The circle wants to know. ' +
      'The site may have opinions about being asked.',
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: AC_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The historical record on the site is deliberately incomplete — ' +
          '{name} finds three separate archive entries that should cross-reference ' +
          'and don\'t, as though each author assumed someone else had written the ' +
          'foundational entry and nobody had. The gap in the record isn\'t accidental. ' +
          'Gaps like this in the circle\'s archives are either administrative failure ' +
          'or someone\'s deliberate project. {name} maps what is known, marks what is ' +
          'absent, and prepares for the likelihood that the site itself will disagree ' +
          'with the partial record. ' +
          '{?has_faction}The circle\'s expeditionary notes from adjacent sites are ' +
          'available through the senior archive. {name} reads them twice.{/has_faction}',
        successAfterimage:
          'History and hazards understood — or understood enough to enter deliberately.',
        failureAfterimage:
          'Records are too sparse. The site\'s dangers will have to be discovered in person.',
      },
      {
        reach: 'veil',
        duration: { min: 3, max: 3 },
        difficulty: (AC_SENIOR_BASE + AC_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.20, bestowed_power: 0.30 },
            tagFilters: ['#veil'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.06,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.70, possession: 0.30 } },
        },
        narrativeTemplate:
          'The ruin is older than its catalog entry in ways that register as ' +
          'physical sensation — a pressure behind the eyes, a faint metallic taste, ' +
          'the sense that the architecture is oriented toward something that no longer ' +
          'exists in quite the same location. {name} works through the accessible ' +
          'chambers methodically, documenting the ward remnants, the inscription patterns, ' +
          'the particular arrangement of the central chamber that implies it was designed ' +
          'for a working of a scale the circle hasn\'t attempted in living memory.',
        successAfterimage:
          'Lost formulae recovered. The ruin\'s purpose, at least partially, understood.',
        failureAfterimage:
          'Ancient defenses activate without warning. {name} retreats through three ' +
          'collapsed corridors with minor injuries and incomplete notes.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} leads an expedition to an ancient arcane site near {location}, ' +
        'working through the accessible ruins for formulae and records the circle hasn\'t seen.',
      success:
        'Knowledge recovered, the site partially mapped, and a question ' +
        'about what it was built to do that the recovered formulae don\'t quite answer.',
      failure:
        'The defenses drove {name} back before the central chamber. ' +
        'What\'s inside is still inside.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The expedition is over. The ruin exists in the same configuration it did before ' +
          '{name} arrived — or it doesn\'t, if the defenses activated. ' +
          'Either way, the circle now knows the site is accessible, that something ' +
          'within it still functions, and that the gap in the archive record was intentional.',
        changes: [
          {
            id: 'ruin_expedition_knowledge',
            kind: 'item',
            title: 'Recovered Formulae',
            detail: 'Lost workings and architectural records from an arcane site whose purpose is unclear.',
            polarity: 'gain',
          },
          {
            id: 'ruin_expedition_mystery',
            kind: 'future_hook',
            title: 'What It Was Built For',
            detail:
              'The central chamber\'s design implies a working of significant scale. ' +
              'The recovered formulae describe components, not purpose.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The ruin has been entered. What does the god see in what {name} brought back?',
        reactions: [
          {
            id: 'ruin_expedition_file_site',
            label: 'The site is a resource. Map it properly.',
            intent:
              'An ancient arcane installation with functional defenses and ' +
              'recoverable knowledge is worth knowing about in detail. ' +
              'The god marks the location and what was found.',
            effects: [
              {
                kind: 'intelligence',
                category: 'arcane_site',
                label: 'Ancient arcane installation — accessed, partially mapped, near {location}',
                detail:
                  'Functional defenses, recovered formulae, central chamber purpose undetermined. ' +
                  'Accessible with preparation.',
                reliability: 0.85,
              },
              { kind: 'reputation_tally', key: 'ac.advanced_research', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'ruin_expedition_seed_return',
            label: 'The central chamber is still locked.',
            intent:
              'The defenses activated before the center was reached. ' +
              'Whatever was built in that chamber is still there. ' +
              'The god marks the unfinished question.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'ac.elite.seal_the_breach',
                delayTicks: 18,
                seedLabel: 'The ruin\'s central chamber activates and begins drawing attention',
              },
              { kind: 'reputation_tally', key: 'ac.advanced_research', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── Elite Quests (Archmage+) ────────────────────────────────────

  {
    id: 'ac.elite.arcane_thesis',
    name: 'Present the Grand Thesis',
    rarityTier: 4,
    intrinsicTier: 'story_beat',
    reach: 'veil',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: ['capital', 'tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    description:
      'Years of research. A theory that either advances the circle\'s understanding ' +
      'of arcane mechanics or demonstrates, in front of the full council, why it doesn\'t. ' +
      'The experiment cannot be partially performed.',
    steps: [
      {
        reach: 'eye',
        duration: { min: 3, max: 3 },
        difficulty: AC_ELITE_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          '{name} has been working toward this for longer than the thesis document ' +
          'reflects — the core insight is years old, the experimental verification ' +
          'is months, the written argument is weeks. What remains is the gap between ' +
          'an argument {they} believe{s} and one {they\'ve} proven. In the final ' +
          'stage of preparation, two of the supporting experiments produce results ' +
          'that don\'t quite match the predictions. Not badly. Not enough to abandon ' +
          'the thesis. But enough that {name} marks the discrepancy and decides, ' +
          'deliberately, how to present it to the council. ' +
          '{?has_ally}Whether {ally:strongest} knows about the discrepancy is a ' +
          'question {name} hasn\'t answered yet.{/has_ally}',
        successAfterimage:
          'The research is complete, the discrepancy documented, the argument solid enough to defend.',
        failureAfterimage:
          'Critical experiments fail to replicate. The thesis has gaps ' +
          'that the council will identify before {name} does.',
      },
      {
        reach: 'veil',
        duration: { min: 2, max: 2 },
        difficulty: (AC_ELITE_BASE + AC_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The council chamber at {location} holds twelve archmages, ' +
          'four visiting scholars, and one junior associate who has been assigned ' +
          'to take notes — which means {name} is the only person in the room ' +
          'who doesn\'t already have an opinion about the thesis. ' +
          '{name} presents the work cleanly, addresses the discrepancy head-on ' +
          'before anyone can raise it, and watches the senior members respond to ' +
          'the honesty with more interest than the theory initially earned.',
        successAfterimage:
          'The council is engaged. The objections are methodological, not dismissive.',
        failureAfterimage:
          'An archmage identifies a flaw in the foundational assumption. ' +
          'The defense becomes a damage-limitation exercise.',
      },
      {
        reach: 'veil',
        duration: { min: 2, max: 2 },
        difficulty: (AC_ELITE_BASE + AC_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.20, bestowed_power: 0.50 },
            tagFilters: ['#veil'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.08,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.70, possession: 0.30 } },
        },
        narrativeTemplate:
          'The demonstration chamber is prepared. {name} has run this experiment ' +
          'nineteen times in the preceding weeks, and it has worked seventeen of them. ' +
          'The council watches in silence that is not quite patience. ' +
          'The working builds in the focal point — exactly as specified, exactly as ' +
          'documented, and then past the specified limit in the way it does ' +
          'sometimes, the way {name} never quite explains in the documentation, ' +
          'into a result that is larger and stranger and more correct than the theory predicts.',
        successAfterimage:
          'The demonstration goes further than the thesis claimed. The council is silent ' +
          'in the particular way of people revising their assumptions.',
        failureAfterimage:
          'The working spirals past the focal point before {name} can contain it. ' +
          'Contained, eventually, but not before everyone in the room understood what almost happened.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} brings years of research before the circle\'s full council — ' +
        'written argument, methodological defense, live demonstration. ' +
        'Theory must become practice in front of the people most qualified to see where it doesn\'t.',
      success:
        'The demonstration exceeded the thesis\'s own claims. ' +
        'The circle will argue about what it means for years. ' +
        '{name}\'s name will be in the argument.',
      failure:
        'The experiment outran its containment. Contained — that\'s the important word. ' +
        'But the council saw it happen, and their silence afterward was not the same ' +
        'kind of silence as before.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The grand thesis has been presented, defended, and demonstrated. ' +
          'The circle\'s understanding of arcane mechanics has shifted — either ' +
          'because the theory holds, or because they\'ve watched it fail in a way ' +
          'that suggests it was almost right. Both outcomes are significant. ' +
          '{name} is someone different now than {they} was{s} before the presentation.',
        changes: [
          {
            id: 'grand_thesis_standing',
            kind: 'reputation',
            title: 'Academic Standing',
            detail: 'A successful thesis establishes {name} at the leading edge of the circle\'s research.',
            polarity: 'mixed',
          },
          {
            id: 'grand_thesis_discovery',
            kind: 'future_hook',
            title: 'Past the Predicted Limit',
            detail:
              'The working exceeded its own parameters. The circle now has a result ' +
              'that the theory doesn\'t fully account for.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The thesis is complete. What does the god preserve from this moment?',
        reactions: [
          {
            id: 'grand_thesis_mark_advance',
            label: 'Something in arcane understanding has moved.',
            intent:
              'What happened in that demonstration chamber — success or contained failure — ' +
              'has changed what the circle believes is possible. The god marks the moment ' +
              'and the question it opened.',
            effects: [
              {
                kind: 'intelligence',
                category: 'arcane_site',
                label: 'Grand thesis demonstration result — circle council present, {location}',
                detail:
                  'Theory successfully demonstrated past its predicted parameters. ' +
                  'The circle\'s senior members are revising fundamental assumptions.',
                reliability: 0.95,
              },
              {
                kind: 'recent_event',
                message: '{name}\'s grand thesis demonstration at {location} moves the circle\'s understanding of arcane mechanics.',
                significance: 0.8,
              },
              { kind: 'reputation_tally', key: 'ac.grand_thesis', delta: 3 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'grand_thesis_seed_consequence',
            label: 'What the demonstration revealed will be pursued.',
            intent:
              'The working exceeded its parameters for a reason. That reason is a question ' +
              'that will not stay unanswered — by the circle, by {name}, or by ' +
              'whatever the working touched when it went past the predicted limit.',
            effects: [
              { kind: 'reputation_tally', key: 'ac.grand_thesis', delta: 3 },
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.7,
                label:
                  '{name}\'s thesis demonstration produced anomalous results — exceeding predicted limits in documented presence of senior council',
                revealFamilies: ['ac.elite', 'investigation'],
              },
              {
                kind: 'encounter_seed',
                templateId: 'ac.elite.seal_the_breach',
                delayTicks: 30,
                seedLabel:
                  'The working {name} demonstrated has drawn attention from beyond the predictable boundary',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ac.elite.seal_the_breach',
    name: 'Seal the Planar Breach',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'veil',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['city', 'capital', 'tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    description:
      'A tear between planes has opened near {location}. Not a large one. ' +
      'Not yet. The question is whether "not yet" can be made permanent.',
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: AC_ELITE_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The breach is in a basement chamber that was a wine cellar until three ' +
          'days ago, when the owner reported that the air had changed and the light ' +
          'moved differently and the walls had started giving slightly under pressure. ' +
          '{name} descends with instruments that aren\'t really designed for this ' +
          'kind of measurement — no instruments are — and begins mapping the tear\'s ' +
          'geometry from the outside. It is not large. It is also not stable. ' +
          'The edges are fraying in a direction that isn\'t spatial, and the ' +
          'fraying has a direction, which means it\'s intentional. ' +
          '{?has_faction}The circle\'s previous breach-sealing notes are in {name}\'s ' +
          'pack, annotated in {their} own hand from last year\'s training exercise. ' +
          'A training exercise on a contained, artificial breach. This is neither.{/has_faction}',
        successAfterimage:
          'The breach is mapped — size, geometry, fraying direction, weak points. A sealing is possible.',
        failureAfterimage:
          'The breach is unstable enough that mapping takes longer than anticipated. ' +
          'The geometry is understood in outline only.',
      },
      {
        reach: 'veil',
        duration: { min: 3, max: 3 },
        difficulty: (AC_ELITE_BASE + AC_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The sealing framework is a specific class of working that requires ' +
          'being built into the geometry of the breach itself, not around it — ' +
          'which means {name} has to work in contact with the tear while constructing ' +
          'the thing that will close it. The contact is not painful exactly. ' +
          'It is the sensation of being looked at by something that doesn\'t share ' +
          'the assumption that {name}\'s perspective is the one that matters. ' +
          '{they} build{s} the framework methodically, thread by thread, ' +
          'not looking at what looks back.',
        successAfterimage: 'The framework holds. The sealing is ready for the final working.',
        failureAfterimage:
          'The framework cracks at the second layer, and something edges through the gap before {name} pulls it closed.',
      },
      {
        reach: 'veil',
        duration: { min: 2, max: 2 },
        difficulty: (AC_ELITE_BASE + AC_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.20, bestowed_power: 0.50 },
            tagFilters: ['#veil'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.08,
        },
        failureMetadata: {
          rewardPool: { categoryWeights: { condition: 0.70, possession: 0.30 } },
        },
        narrativeTemplate:
          '{name} channels everything into the final working — not force, ' +
          'because the breach doesn\'t respond to force, but the specific geometric ' +
          'pressure that tells a tear that there is no space for it here, that the ' +
          'boundary is closed, that what lies on the other side has no purchase ' +
          'on this one. The breach closes with a sound that is somewhere between ' +
          'a bell and a question. The basement is a basement again. ' +
          'The wine that survived is still cold.',
        successAfterimage:
          'The breach is sealed. The geometry is clean. The wine cellar is a wine cellar again.',
        failureAfterimage:
          'The breach narrows but doesn\'t close — a partial sealing, ' +
          'stable for now, that {name} and the circle both know is not a solution.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} descends into a {location} basement to map, framework, and seal ' +
        'a planar breach before it becomes the kind of problem that shows up in ' +
        'contemporary accounts of magical disasters.',
      success:
        'Sealed. The breach is gone. The question of why it opened is filed separately, ' +
        'under the category of things the circle intends to understand eventually.',
      failure:
        'Narrowed. The breach holds at a reduced size, stable under current conditions, ' +
        'which is not the same as stable under future ones.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The breach is sealed, or it isn\'t quite. Either way, {name} has been in ' +
          'direct contact with a planar tear, and whatever maintained the intentional ' +
          'fraying has had extended opportunity to observe {name} working. ' +
          'The basement at {location} is safe. The broader question about why the ' +
          'breach appeared there specifically is not resolved.',
        changes: [
          {
            id: 'breach_seal_outcome',
            kind: 'reputation',
            title: 'Breach Response',
            detail: 'A sealed breach elevates {name}\'s standing among practical mages. A partial seal raises questions.',
            polarity: 'mixed',
          },
          {
            id: 'breach_seal_cause',
            kind: 'future_hook',
            title: 'Why Here',
            detail:
              'The fraying was intentional. Something caused this specific breach in this specific location.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The breach is sealed or narrowed. What does the god hold from the encounter?',
        reactions: [
          {
            id: 'breach_seal_mark_cause',
            label: 'The breach was deliberate. Something chose that basement.',
            intent:
              'Intentional planar fraying at a specific location doesn\'t happen without a reason ' +
              'and without an agent. The god marks the deliberate quality of what {name} found.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.7,
                label:
                  'Planar breach at {location} was deliberately initiated — external agency confirmed, identity unknown',
                revealFamilies: ['ac.elite', 'investigation'],
              },
              { kind: 'reputation_tally', key: 'ac.breach_response', delta: 3 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'breach_seal_recent_event',
            label: 'The circle knows what {name} did today.',
            intent:
              'Sealing a planar breach is significant work, and the circle\'s senior members ' +
              'will hear of it. The god marks the accomplishment and what it means for standing.',
            effects: [
              {
                kind: 'recent_event',
                message: '{name} seals a planar breach near {location}. The circle takes note.',
                significance: 0.75,
              },
              { kind: 'reputation_tally', key: 'ac.breach_response', delta: 3 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Social Encounters ──────────────────────────────────────────────────

export const ARCANE_CIRCLE_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [
  {
    id: 'ac.social.lecture_hall',
    name: 'Attend a Lecture',
    rarityTier: 1,
    intrinsicTier: 'background',
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
        difficulty: AC_SOCIAL_DIFFICULTY / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#eye'],
          },
          reputationDelta: 0.02,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The lecture hall at {location}\'s circle fills in the particular way of a room ' +
          'where everyone is attending by choice — not quite silent, not quite still, ' +
          'the low-frequency hum of people who are already thinking about what they\'re about ' +
          'to hear. {name} takes a seat near the middle, which is always the best position ' +
          'for watching both the speaker and the audience. The senior mage at the front ' +
          'begins with a question that {name} realizes, by the third sentence, ' +
          '{they} cannot{s} answer. The lecture is going to be better than expected. ' +
          '{?has_faction}Sitting two rows forward: a magister whose published work ' +
          '{name} has read and disagreed with. Watching that person\'s reaction ' +
          'is going to be instructive.{/has_faction}',
        successAfterimage:
          '{name} leaves with two ideas that weren\'t there before the lecture began.',
        failureAfterimage:
          'The theoretical framework is beyond {their} current foundation. ' +
          'Not wasted time, but not useful yet.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} attends a circle lecture on arcane theory at {location}. ' +
        'The best lectures are the ones that change what the questions are.',
      success: 'Two new ideas and one productive argument to have with {their} existing assumptions.',
      failure: 'The material was past {their} current foundation. Something to return to.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The lecture hall empties and {name} carries what {they} took{s} from it. ' +
          'The circle runs dozens of these; most are good. This one was either better than most ' +
          'or reminded {name} how much remains to understand.',
        changes: [
          {
            id: 'lecture_hall_knowledge',
            kind: 'item',
            title: 'New Framework',
            detail: 'A concept encountered, partially understood, ready to either confirm or complicate existing assumptions.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'The lecture is over. What does the god observe in how {name} leaves?',
        reactions: [
          {
            id: 'lecture_hall_note_connection',
            label: 'The speaker said something the circle isn\'t ready to hear yet.',
            intent:
              'Lectures that change the questions rather than answer them are the ones ' +
              'that matter later. The god marks what {name} learned — and who else was in the room.',
            effects: [
              {
                kind: 'intelligence',
                category: 'agent_network',
                label: 'Lecture insight — circle theoretical discussion at {location}',
                detail:
                  'An argument in progress within the circle\'s senior ranks. ' +
                  'Which mages attended and how they responded.',
                reliability: 0.7,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'lecture_hall_release',
            label: 'Absorbed and released.',
            intent: 'The knowledge was taken. The god does not track what {name} does with it.',
            effects: [
              { kind: 'reputation_tally', key: 'ac.scholarship', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ac.social.spell_exchange',
    name: 'Spell Exchange',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'veil',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['city', 'capital', 'tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'veil',
        duration: { min: 1, max: 1 },
        difficulty: AC_SOCIAL_DIFFICULTY / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#veil'],
          },
          reputationDelta: 0.02,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'Formula exchange sessions have the particular economy of people who know that ' +
          'information is more fungible than objects — a good working shared is worth ' +
          'more than one hoarded, because it generates discussion that generates refinement. ' +
          '{name} arrives at the exchange with two formulae prepared and watches what ' +
          'the other practitioners bring to the table. The quality varies. ' +
          '{?has_faction}The circle\'s exchange has an informal quality filter — ' +
          'habitual sharers of thin material stop being invited, which means ' +
          'the average quality of what circulates here is genuinely useful.{/has_faction}' +
          '{?no_faction}Open exchange means uneven exchange. Some of what\'s on offer today ' +
          'is derivative work. Some is genuinely original.{/no_faction}',
        successAfterimage: 'A formula acquired that {name} hasn\'t seen before. Worth developing.',
        failureAfterimage: 'Nothing of value offered in return for what {name} brought.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} participates in a formulae exchange at {location}\'s circle. ' +
        'Knowledge economy in its most direct form.',
      success: 'A genuinely useful formula. The exchange was worth the session.',
      failure: 'Nothing worth the trade. The market was thin today.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The exchange concludes. {name} carries what {they} acquired, or doesn\'t, ' +
          'and returns what {they} gave{s} to the pool of shared knowledge ' +
          'that the circle maintains by informal consensus.',
        changes: [
          {
            id: 'spell_exchange_formula',
            kind: 'item',
            title: 'Exchanged Formulae',
            detail: 'A working shared and a working received. Knowledge is more useful in circulation.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'The exchange is complete. What does the god mark in what passed between practitioners?',
        reactions: [
          {
            id: 'spell_exchange_note_network',
            label: 'Who shares what says something about the circle\'s state.',
            intent:
              'Formula exchanges are a map of who\'s working on what and at what depth. ' +
              'The god observes the landscape — who brought original material, ' +
              'who brought derivative work, what areas are being actively developed.',
            effects: [
              {
                kind: 'intelligence',
                category: 'agent_network',
                label: 'Circle formula exchange — participant focus areas, {location}',
                detail:
                  'What practitioners are actively developing. What areas have gone quiet. ' +
                  'Useful for understanding the circle\'s current research priorities.',
                reliability: 0.65,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'spell_exchange_release',
            label: 'The formula is useful. That\'s enough.',
            intent: 'The exchange was complete. The god releases the thread.',
            effects: [
              { kind: 'reputation_tally', key: 'ac.guild_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  {
    id: 'ac.social.library_browse',
    name: 'Browse the Library',
    rarityTier: 1,
    intrinsicTier: 'background',
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
        difficulty: AC_SOCIAL_DIFFICULTY / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#eye'],
          },
          reputationDelta: 0.02,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The circle\'s library at {location} holds the particular silence of a room ' +
          'that is used seriously — not the hush of reverence, but the quiet of ' +
          'concentrated attention. {name} isn\'t looking for anything specific, ' +
          'which is often how the most interesting things are found. {they} move{s} ' +
          'through the stacks by interest rather than catalog order, pulling volumes ' +
          'to read the first page and the last, which is a way of finding out what ' +
          'a book is actually about rather than what its title claims. ' +
          '{?has_faction}The circle\'s acquisition notes are written in the margins ' +
          'of the catalog entries — small annotations from generations of mages ' +
          'who had opinions about what was worth acquiring and what wasn\'t.{/has_faction}',
        successAfterimage:
          'A text in the wrong section, filed under a category it doesn\'t belong to.',
        failureAfterimage: 'Nothing new. The shelves hold only what {name} already knows is there.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} browses the circle\'s library at {location} without an agenda. ' +
        'The best finds are the ones you weren\'t looking for.',
      success: 'A misfiled text. Possibly significant. Possibly an administrative error. Possibly both.',
      failure: 'Familiar shelves, familiar titles. Nothing that wasn\'t already known.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The library closes for the evening, or {name} leaves before it does. ' +
          'What {they} found{s} or didn\'t find is now part of {their} knowledge ' +
          'of what the circle holds — and what it misfiled.',
        changes: [
          {
            id: 'library_browse_find',
            kind: 'item',
            title: 'Library Discovery',
            detail: 'Something found in the wrong place, or nothing found. Depends on the morning.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god notice in what {name} found on those shelves?',
        reactions: [
          {
            id: 'library_browse_misfiled',
            label: 'That text wasn\'t filed by accident.',
            intent:
              'Books in the wrong section of the circle\'s catalog are either errors ' +
              'or decisions. The god marks the item — and the question of which this is.',
            effects: [
              {
                kind: 'intelligence',
                category: 'arcane_site',
                label: 'Misfiled text in circle library at {location}',
                detail:
                  'A volume in the wrong catalog section. Content inconsistent with its registered description. ' +
                  'Possibly administrative. Possibly not.',
                reliability: 0.6,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'library_browse_ordinary',
            label: 'A productive afternoon in the stacks.',
            intent: 'The library was used. The god observes and moves on.',
            effects: [
              { kind: 'reputation_tally', key: 'ac.scholarship', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Join & Promotion ───────────────────────────────────────────────────

export const AC_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'ac.join',
  name: 'Join the Arcane Circle',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  reach: 'veil',
  crudType: 'read',
  scale: 'local',
  locationSubtypes: ['city', 'capital', 'tower'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  steps: [
    {
      reach: 'veil',
      duration: { min: 1, max: 1 },
      difficulty: AC_JOIN_DIFFICULTY / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        tierPromotionEligible: true,
        reputationDelta: 0.05,
      },
      failureMetadata: {
        reputationDelta: -0.01,
      },
      narrativeTemplate:
        'The circle\'s aptitude test is not subtle — a senior mage conducts it in ' +
        'a room that smells of ozone and old calibration fluid, asking {name} to ' +
        'perform a sequence of small workings that individually mean nothing and ' +
        'collectively reveal the shape of {their} magical perception. ' +
        'It isn\'t a test of power. The circle is not particularly interested in power. ' +
        'It is a test of precision — whether the edges of {their} workings land where ' +
        '{name} intends them to, or whether {they} go{es} somewhere adjacent and call it close enough. ' +
        '{?has_faction}Whatever organization {name} comes from, the circle will ' +
        'have encountered practitioners from it before. Whether that helps or ' +
        'complicates the evaluation depends on what {they} remember of the last one.{/has_faction}',
      successAfterimage:
        'Precision confirmed. The senior mage records the result without visible reaction, ' +
        'which is what approval looks like here.',
      failureAfterimage:
        'The workings land slightly wide. The circle does not accept \'close enough.\'',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name} submits to the circle\'s aptitude examination in {location}. ' +
      'Precision, not power. The test is calibrated to find the former.',
    success: '{name} is accepted as apprentice. The circle\'s expectations are already clear.',
    failure: 'Not yet. The precision isn\'t there, or it wasn\'t there today.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        '{name} either joins the circle or doesn\'t. The examination room is ' +
        'cleaned and reset for the next candidate, with the same efficiency the circle ' +
        'applies to all processes it considers important.',
      changes: [
        {
          id: 'ac_join_membership',
          kind: 'reputation',
          title: 'Circle Membership',
          detail: 'Entry means access to the library, the laboratory, the network, and the obligations.',
          polarity: 'gain',
        },
      ],
      reactionPrompt: 'What does the god see in this beginning?',
      reactions: [
        {
          id: 'ac_join_mark_entry',
          label: 'This is where the shape of things changes.',
          intent:
            'Entry to the circle is a threshold that changes what knowledge is available ' +
            'and what responsibilities accumulate. The god marks it.',
          effects: [
            { kind: 'reputation_tally', key: 'ac.guild_membership', delta: 2 },
            {
              kind: 'recent_event',
              message: '{name} joins the Arcane Circle in {location}. The circle opens.',
              significance: 0.5,
            },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const AC_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'ac.promotion',
  name: 'Arcane Advancement',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'veil',
  crudType: 'read',
  scale: 'local',
  locationSubtypes: ['city', 'capital', 'tower'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
  steps: [
    {
      reach: 'veil',
      duration: { min: 2, max: 2 },
      difficulty: AC_PROMOTION_DIFFICULTY / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        tierPromotionEligible: true,
        reputationDelta: 0.06,
      },
      failureMetadata: {
        reputationDelta: -0.02,
      },
      narrativeTemplate:
        'Higher rank in the circle is demonstrated, not awarded — the practical ' +
        'examination is a sequence of workings calibrated to the candidate\'s ' +
        'current tier, plus the specific precision requirements of the one above it. ' +
        '{name} enters the examination chamber knowing that the examiners are watching ' +
        'not just the workings but the decisions that precede them: whether {they} check{es} ' +
        '{their} instruments before proceeding, whether {they} adjust{s} when the first ' +
        'working comes in slightly off-specification, whether {they} know{s} when to stop ' +
        'and recalibrate versus when to continue. ' +
        '{?has_faction}The circle has seen {name} work for long enough to have opinions. ' +
        'The examiners are not neutral. They are hoping for a specific result, ' +
        'which is the only kind of hope that actually motivates rigorous evaluation.{/has_faction}' +
        '{?no_faction}The examination is conducted by strangers to {them}. ' +
        'No prior expectations, which means no prior investment in the outcome.{/no_faction}',
      successAfterimage:
        'The workings land exactly. The examiners make notes without discussing them out loud, ' +
        'which is how the circle indicates something worth writing down.',
      failureAfterimage:
        'The workings are good, but the decisions around them aren\'t. ' +
        'The circle promotes mastery of process, not just execution.',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name} sits the practical examination for arcane advancement in {location}. ' +
      'Not a test of knowledge. A test of precision, process, and when to stop.',
    success: 'New rank. The circle acknowledges it in the registry without ceremony.',
    failure: 'The workings were adequate. The decisions that surrounded them weren\'t. Not yet.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The examination is scored and entered in the circle\'s records. ' +
        '{name} either advances or continues at the current rank, ' +
        'with the particular clarity that comes from having been evaluated ' +
        'by people who know precisely what they\'re looking for.',
      changes: [
        {
          id: 'ac_promotion_rank',
          kind: 'reputation',
          title: 'Circle Rank',
          detail: 'Advancement opens new responsibilities, new laboratory access, and new assignments.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'The advancement is decided. What does the god see in what this rank means?',
      reactions: [
        {
          id: 'ac_promotion_advance',
          label: 'The rank is real. Mark the new capacity.',
          intent:
            'A new rank in the circle means different access, different assignments, ' +
            'and different expectations. The god marks the transition and what it opens.',
          effects: [
            { kind: 'clearance_gate_tag', tag: 'ac.rank_advanced' },
            { kind: 'reputation_tally', key: 'ac.guild_rank', delta: 3 },
            {
              kind: 'recent_event',
              message: '{name} advances within the Arcane Circle in {location}. The registry is updated.',
              significance: 0.55,
            },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const AC_LIFECYCLE_TEMPLATES: readonly UnifiedActionTemplate[] = [
  AC_JOIN_TEMPLATE,
  AC_PROMOTION_TEMPLATE,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

/**
 * Look up an arcane circle encounter template by ID.
 */
export function getArcaneCircleEncounterById(id: string): UnifiedActionTemplate | undefined {
  return ARCANE_CIRCLE_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? AC_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? ARCANE_CIRCLE_SOCIAL_TEMPLATES.find(t => t.id === id);
}
