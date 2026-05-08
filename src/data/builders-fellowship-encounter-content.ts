/**
 * Builders Fellowship Encounter Content — migrated to UnifiedActionTemplate (THR-93).
 *
 * Quest, social, join, and promotion templates for the Builders Fellowship.
 * All 13 standard + 2 lifecycle templates, plus 3 social templates, rewritten to
 * UnifiedActionTemplate format with Threadbare-aesthetic prose (patient-material voice,
 * quiet satisfaction, craft pride cracking inward), enrichment placeholders, and
 * contextual aftermath (spawn_artifact GraphOps for persistent world nodes, reputation
 * tallies for craft honour, hidden marks for flawed work, encounter seeds for futures).
 *
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';
import { withEncounterContract } from './encounter-contract-builder';

// ─── Constants ────────────────────────────────────────────────────────────

const BF_DIFFICULTY_BASE = 25;
const BF_DIFFICULTY_STEP = 10;
const BF_SENIOR_BASE = 40;
const BF_ELITE_BASE = 55;
const BF_JOIN_DIFFICULTY = 20;
const BF_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ──────────────────────────────────

export const BUILDERS_FELLOWSHIP_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  ['bf.join', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.0, questType: 'standard' }],
  ['bf.promotion', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.0, questType: 'standard' }],
  ['bf.quest.repair_wall', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['bf.quest.lay_foundation', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['bf.quest.forge_tools', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.04, questType: 'standard' }],
  ['bf.quest.survey_site', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.05, questType: 'standard' }],
  ['bf.quest.craft_commission', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.05, questType: 'standard' }],
  ['bf.senior.raise_bridge', { factionDefId: 'builders_fellowship', minRank: 'journeyman', reputationReward: 0.06, questType: 'senior' }],
  ['bf.senior.design_fortification', { factionDefId: 'builders_fellowship', minRank: 'journeyman', reputationReward: 0.06, questType: 'senior' }],
  ['bf.senior.master_craft', { factionDefId: 'builders_fellowship', minRank: 'journeyman', reputationReward: 0.06, questType: 'senior' }],
  ['bf.elite.grand_monument', { factionDefId: 'builders_fellowship', minRank: 'master_builder', reputationReward: 0.08, questType: 'elite' }],
  ['bf.elite.engineer_wonder', { factionDefId: 'builders_fellowship', minRank: 'master_builder', reputationReward: 0.08, questType: 'elite' }],
  ['bf.social.workshop_tour', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
  ['bf.social.guild_feast', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
  ['bf.social.material_trade', { factionDefId: 'builders_fellowship', minRank: 'apprentice', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Templates ────────────────────────────────────────────────────────────

export const BUILDERS_FELLOWSHIP_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [
  // ── Standard Quests (Apprentice+) ──────────────────────────────

  withEncounterContract({
    id: 'bf.quest.repair_wall',
    name: 'Repair the Wall',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'stone',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        reach: 'stone',
        duration: { min: 1, max: 1 },
        difficulty: BF_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The wall at the north ward has been patient about its failure — the seep-through came ' +
          'years before the crack, and the crack years before the bulge that is why {name} is here ' +
          'now. {They} run{s} the back of {their} hand along the face. Cold through to the palm. ' +
          'The damage is older than the visible break: the face is the last thing to go, not the first. ' +
          '{?has_artifact}The iron probe {name} carries confirms what the hand suggested — the ' +
          'backing is loose for nearly three spans, well beyond the visible fracture line.{/has_artifact}' +
          '{?no_artifact}Without a probe, {their} reading comes from the sound a knuckle makes on ' +
          'stone that is backed solidly versus stone that is not. {name} tap{s} methodically, listening.{/no_artifact}',
        successAfterimage:
          'The damage runs two courses deeper than the foreman\'s report said. ' +
          '{name} extends the chalk mark before the light goes.',
        failureAfterimage:
          '{name}\'s assessment matches what the eye can see. ' +
          'What the eye cannot see will announce itself in the next wet season.',
      },
      {
        reach: 'stone',
        duration: { min: 3, max: 3 },
        difficulty: (BF_DIFFICULTY_BASE + BF_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
          },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'New stone, new mortar, the particular patience required when the courses above will ' +
          'show where any error lives. {name} work{s} from the bottom up, tapping each ' +
          'stone into position with the flat of the hammer. ' +
          '{?has_artifact}The square and level make this measurable rather than approximate — ' +
          '{name} check{s} each stone before pressing it into the bed.{/has_artifact}' +
          '{?no_artifact}Eye and hand have to serve where instruments would be more reliable. ' +
          '{name} work{s} slower to compensate.{/no_artifact} ' +
          'The wall will not remember this section was weak. That is the point of repair work: the forgetting.',
        successAfterimage:
          'The repaired section ring{s} when tapped — the sound of stone properly bedded. ' +
          '{name} give{s} it three days before weight-testing. Mortar needs to cure.',
        failureAfterimage:
          'The repair hold{s} its shape. The joint at the second course is a fraction thin — ' +
          'visible to a mason who know{s} what to look for, invisible to the client.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is assigned a crumbling wall section in {location}. ' +
        'The first job is to understand what actually failed, not just what it looks like from outside.',
      success:
        'The section is sound. The repair is in the record.',
      failure:
        'The repair is complete. Whether it holds against the next winter is a different calculation.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The wall section has been assessed and repaired. ' +
          'What was found during the work is now part of {name}\'s record with the Fellowship.',
        changes: [
          {
            id: 'repair_standing',
            kind: 'reputation',
            title: 'Construction Record',
            detail: 'Careful repair builds trust in {name}\'s site judgment. A missed defect will surface when the wall opens again.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note about the wall and what was found in it?',
        reactions: [
          {
            id: 'repair_note_defect',
            label: 'The backing was compromised further than the report described.',
            intent:
              'The visible crack was the easy part. Behind it was something the original builders ' +
              'did wrong and no one caught — a drainage defect that will affect adjacent sections.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Hidden backing failure behind repaired wall section in {location}',
                detail:
                  'Rubble fill degraded beyond the visible damage boundary. Root cause is a drainage ' +
                  'defect, not frost alone — adjacent sections may have the same condition.',
                reliability: 0.75,
              },
              {
                // THR-139 pilot: a builder returning to a politically-charged repair
                // surfaces what they already know about hidden faults — leverage if
                // the alignments hold, embarrassment if the secret has gone public.
                kind: 'intel_referenced_prose',
                category: 'political_secret',
                prose: {
                  reliable: '{name} read the gathering\'s hidden currents with the unhurried precision of someone who already knew which faction was bargaining and which was pretending.',
                  uncertain: '{name} carried a partial map of who feared whom in {location} — the names were right, the urgency had shifted, and the leverage moved accordingly.',
                  dubious: '{name} pressed where the briefing said pressing would yield, and the room laughed quietly — the secret had aged into a story everyone now told.',
                },
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'repair_complete',
            label: 'The section is sound. File the work.',
            intent: 'Work done, logged, and moved on from.',
            effects: [
              { kind: 'reputation_tally', key: 'stone.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'bf.quest.lay_foundation',
    name: 'Lay a Foundation',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'stone',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        reach: 'stone',
        duration: { min: 2, max: 2 },
        difficulty: BF_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The site has been staked by the commissioner\'s surveyor and found adequate. ' +
          '{name} run{s} a level line from the primary corner stake to the secondary and watch{s} ' +
          'the bubble. The surveyor was working to a less precise tolerance than the Fellowship requires. ' +
          '{?has_artifact}The transit {name} carries catch{es} what the eye misses: a half-degree ' +
          'fall toward the east over eighteen feet, which is not nothing when the building runs ' +
          'three storeys.{/has_artifact}' +
          '{?no_artifact}The level string tells {name} what the ground wants to tell — that what ' +
          'reads as flat rarely is, and that what reads as acceptable now will express itself as a ' +
          'crack in a load wall in forty years.{/no_artifact}',
        successAfterimage:
          'The northeast corner stake moves four inches. ' +
          'The surveyor\'s plan gets a correction note.',
        failureAfterimage:
          'The stakes stay where the surveyor put them. ' +
          'The fall in the ground will become a fall in someone\'s budget eventually.',
      },
      {
        reach: 'stone',
        duration: { min: 3, max: 3 },
        difficulty: (BF_DIFFICULTY_BASE + BF_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The forms are set, the mix is ready. Foundation mortar has one job: to not be ' +
          'interesting, ever. {name} work{s} from the corners inward, tamping each layer before ' +
          'adding the next. No air pockets. No dry patches at the perimeter where the mix got too ' +
          'close to the form edge and sanded out. ' +
          '{?has_artifact}Good aggregate makes the consistency reliable — the mix {name} carries ' +
          'go{s} in the same way every time, corner to center.{/has_artifact} ' +
          'The building that rises above this will have its own crises. This part does not have to be one of them.',
        successAfterimage:
          'The surface sets level to the marked datum. ' +
          '{name} trowel{s} the joint perimeter and leaves the site.',
        failureAfterimage:
          'A hairline appears in the northeast corner as the forms come off. Not structural. ' +
          'The kind of thing a builder note{s}, alone, without writing it down.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} begins site preparation for a foundation in {location}. ' +
        'What goes below grade determines everything above it.',
      success:
        'A foundation laid to Fellowship standards. The building above it does not yet exist.',
      failure:
        'The foundation is in the ground. The crack in the northeast corner is also in the ground.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The foundation has been laid. A commitment to a structure now exists in {location} ' +
          'where before there was only a plan.',
        changes: [
          {
            id: 'foundation_work',
            kind: 'future_hook',
            title: 'Something Built',
            detail: 'A foundation is a commitment. The structure above it will be built, eventually, by someone.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god note about the foundation and what it begins?',
        reactions: [
          {
            id: 'foundation_node',
            label: 'The stone is in the ground.',
            intent:
              'The site now has a permanent commitment to a structure. ' +
              'Whatever is built above it will trace its history to this morning.',
            effects: [
              {
                kind: 'spawn_artifact',
                category: 'mundane',
                tier: 'shaping',
                nameOverride: 'Foundation Stonework',
                tags: ['#structure', '#foundation', '#builders_fellowship'],
                messageOverride:
                  '{name} lays the foundation stone at {location}. ' +
                  'The ground holds it; the building above it is still a plan.',
              },
              {
                kind: 'encounter_seed',
                templateId: 'bf.quest.craft_commission',
                delayTicks: 12,
                seedLabel: 'A foundation without a building draws commissions',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'foundation_tally',
            label: 'The site is prepared. The work is logged.',
            intent: 'The record grows by one entry.',
            effects: [
              { kind: 'reputation_tally', key: 'stone.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'bf.quest.forge_tools',
    name: 'Forge New Tools',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'stone',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        reach: 'stone',
        duration: { min: 2, max: 2 },
        difficulty: BF_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The iron stock look{s} clean under normal light. {name} knock{s} a test piece into ' +
          'the forge to read it under heat: the color tells {name} what the metal is hiding. ' +
          'Good stock burn{s} orange and settle{s}; impure stock blush{es} in patches and smell{s} of sulfur. ' +
          '{?has_artifact}The quality tongs {name} carries let {them} position the test piece ' +
          'precisely — reading the grain requires controlled contact, not guesswork.{/has_artifact}' +
          '{?no_artifact}The smithy\'s standard tongs will do if {name} account{s} for the slop ' +
          'in the joint. Every instrument reveals something about its limits.{/no_artifact} ' +
          'The first step is not making anything. The first step is finding out what the stock will and will not give.',
        successAfterimage:
          'The test piece burn{s} clean. The stock will answer the hammer honestly.',
        failureAfterimage:
          'A faint sulfur edge in the second heat. ' +
          'The impurity is present; its severity is not yet known.',
      },
      {
        reach: 'stone',
        duration: { min: 2, max: 2 },
        difficulty: (BF_DIFFICULTY_BASE + BF_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.20, bestowed_power: 0.20 },
          },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'Hammer, quench, examine. The cycle repeats until the metal tells {name} it is done — ' +
          'not until {they} decid{es} it is done. Those are different ending conditions. ' +
          'Tools made to a deadline and not to the metal\'s will carry their deadline into every ' +
          'job they are used on. ' +
          '{?has_artifact}Working with quality stock and quality tools, the combination close{s} ' +
          'the margin considerably.{/has_artifact} ' +
          'The last heat, the last quench. The tools cool on the rack. ' +
          '{name} tap{s} each one with a finger, feeling the ring.',
        successAfterimage:
          'The ring is clear and even. These tools will answer the hand that uses them.',
        failureAfterimage:
          'One of the three has a flat note — a stress fold from the third draw that {name} felt ' +
          'and should have addressed before the quench. It will not fail immediately. ' +
          'It will fail at load, which is not the same as immediately.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} takes commission to forge new tools for the Fellowship at {location}. ' +
        'The stock decides more than the smith.',
      success:
        'Tools made to the standard the metal allowed. The Fellowship is better-equipped.',
      failure:
        'Tools made and delivered. One of them will need close attention under heavy use.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The tools have been forged. What came out of the fire reflects what went in — ' +
          'both the metal and the attention {name} brought to it.',
        changes: [
          {
            id: 'forge_craft',
            kind: 'item',
            title: 'Tools Forged',
            detail: 'What came out of the forge reflects what went in — both the metal and the attention.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note about the tools and the work that made them?',
        reactions: [
          {
            id: 'forge_tools_made',
            label: 'The tools go out under {name}\'s name.',
            intent:
              'What {name} made will be used. If the work was honest, the tools will say so. ' +
              'If it was not, they will also say so — at load, eventually.',
            effects: [
              {
                kind: 'spawn_artifact',
                category: 'mundane',
                tier: 'shaping',
                nameOverride: 'Fellowship Work Tools',
                tags: ['#tools', '#forged', '#builders_fellowship'],
                targetAgentId: '$actor',
                messageOverride:
                  '{name} forges a set of work tools at the smithy in {location}. ' +
                  'The quality is what the fire and the maker between them produced.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'forge_tools_flawed',
            label: 'One tool has a stress fold. It was passed as sound.',
            intent:
              'The fault is real and {name} know{s} it. The tool will pass inspection ' +
              'and fail at load. Someone will be using it when that happens.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.3,
                label: '{name} forged a tool with a stress fold and passed it as sound workmanship at {location}',
                revealFamilies: ['bf.quest', 'bf.senior', 'investigation'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'forge_tally',
            label: 'The work is complete. Log it.',
            intent: 'The tools are made and delivered. Whatever quality they carry, they carry forward now.',
            effects: [
              { kind: 'reputation_tally', key: 'stone.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'bf.quest.survey_site',
    name: 'Survey a Building Site',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'stone',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: (BF_DIFFICULTY_BASE + 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The patron want{s} a building on the corner lot at the east end of the market district. ' +
          'What the deed says and what the lot is are two different arguments. ' +
          '{?has_artifact}The surveying rod and transit {name} carries turn this into a formal ' +
          'record rather than an approximation — the ground drop{s} half a degree toward the ' +
          'north over twenty feet, which matter{s} when the drainage channel in the street was ' +
          'designed for a narrower frontage.{/has_artifact}' +
          '{?no_artifact}Without formal instruments, {name} work{s} the lot by stretched line ' +
          'and plumb bob. The answers are honest if the process is careful; it just takes longer.{/no_artifact} ' +
          'The lot\'s real dimensions are now {name}\'s problem to document accurately.',
        successAfterimage:
          'The north drainage issue is confirmed and measured. The patron\'s architect will need to know.',
        failureAfterimage:
          'The measurements are recorded. The north drainage issue is in the notes as a flag, not a finding.',
      },
      {
        reach: 'stone',
        duration: { min: 2, max: 2 },
        difficulty: (BF_DIFFICULTY_BASE + BF_DIFFICULTY_STEP + 5) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.05,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
          },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The survey data tells {name} what the lot can support and what it cannot. ' +
          'The plans that come out of this desk work are a set of constraints the builder ' +
          'and the patron will argue with — which means the constraints have to be defensible. ' +
          '{name} draw{s} the drainage solution first because that is the one that will cost ' +
          'most to change later. A building planned around its drainage is a building that will ' +
          'not surprise anyone in the third decade.',
        successAfterimage:
          'Clean plans delivered. The drainage solution is in the drawings before the walls are.',
        failureAfterimage:
          'Plans delivered. The drainage solution contain{s} an assumption {name} will need to revisit ' +
          'when someone else build{s} from them.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} survey{s} a prospective building site in {location}. ' +
        'The lot is already purchased; the question is what it will take to build on.',
      success:
        'Survey complete. The plans reveal what the lot actually is, not what the deed says it is.',
      failure:
        'Survey complete. The drainage correction is noted; its full consequence is not yet calculated.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The site survey is complete and the plans are in the patron\'s hands. ' +
          'The lot has been measured; what comes next depends on what the patron does with the findings.',
        changes: [
          {
            id: 'survey_findings',
            kind: 'future_hook',
            title: 'Site Assessed',
            detail: 'A survey this thorough produces plans a builder can use. Someone will use them.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god take from the surveyed site and its plans?',
        reactions: [
          {
            id: 'survey_drainage_intel',
            label: 'The drainage issue will cost the patron more than they expect.',
            intent:
              'The patron did not know about the drainage channel before commissioning this site. ' +
              'That information changes the budget considerably.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Site drainage defect at prospective build location in {location}',
                detail:
                  'Northern lot has a grade fall over twenty feet; existing street drainage channel ' +
                  'is undersized for the proposed structure. Excavation cost significantly higher ' +
                  'than the patron\'s budget assumes.',
                reliability: 0.85,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'survey_seeds_construction',
            label: 'Plans completed. The commission will follow.',
            intent: 'A survey this thorough produces plans someone will build from.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'bf.quest.lay_foundation',
                delayTicks: 10,
                seedLabel: 'Detailed plans in the patron\'s hands — the construction commission is likely to follow',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'survey_done',
            label: 'Plans delivered. Work logged.',
            intent: 'The survey is complete.',
            effects: [
              { kind: 'reputation_tally', key: 'stone.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'bf.quest.craft_commission',
    name: 'Fulfill a Craft Commission',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'stone',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        reach: 'gold',
        duration: { min: 1, max: 1 },
        difficulty: BF_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The commission is for decorative ironwork — a merchant family upgrading their main hall ' +
          'and wanting the hinges, escutcheons, and fireplace surround to match. ' +
          '{name} listen{s} to what the client say{s} and what the client mean{s} by it. ' +
          'The timeline they propose is aggressive, and aggressive timelines mean one of three things: ' +
          'rushed work, inflated price, or a client who does not understand what they are asking. ' +
          '{name} name{s} a realistic completion date. The client accept{s} it, or {they} do not.',
        successAfterimage:
          'Fair terms agreed. The deposit is paid. The timeline is the one the work requires.',
        failureAfterimage:
          'The client drove the timeline down. The margin is tight enough that something will give.',
      },
      {
        reach: 'stone',
        duration: { min: 3, max: 3 },
        difficulty: (BF_DIFFICULTY_BASE + BF_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.05,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
          },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'Three weeks of close work: hammer and chisel for the decorative elements, ' +
          'careful filing for the fit surfaces. {name} check{s} each piece against the ' +
          'specification drawings before final finishing. ' +
          '{?has_artifact}The quality tools {name} maintains let {them} hold tolerances that ' +
          'would be guesswork with worn equipment — the escutcheon detail work is readable for it.{/has_artifact}' +
          '{?no_artifact}Standard smithy tools, used with enough care to compensate for their limits. ' +
          'There is a gap between achievable and ideal that the tools determine and the maker works within.{/no_artifact} ' +
          'Every piece comes off the bench and is held against the light. ' +
          'The light does not lie about fit.',
        successAfterimage:
          'The commission delivered to specification and then some. ' +
          'The client examines the escutcheons and says nothing, which from this client means approval.',
        failureAfterimage:
          'The commission delivered. The proportions on the center escutcheon are fractionally off. ' +
          'The client will not notice. {name} notice{s}.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} takes a decorative ironwork commission in {location}. ' +
        'The client has specific expectations and a timeline {name} has to decide whether to accept.',
      success:
        'The commission delivered. The merchant has their ironwork; {name} has their name on it.',
      failure:
        'The commission delivered. The center escutcheon carries a deviation from specification.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The ironwork commission is complete. What {name} made will be in that hall ' +
          'long after the merchant who commissioned it.',
        changes: [
          {
            id: 'commission_craft',
            kind: 'item',
            title: 'Commission Completed',
            detail: 'Work made to specification — or nearly. The deviation, if any, lives in the world under {name}\'s name.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the delivered commission?',
        reactions: [
          {
            id: 'commission_delivered',
            label: 'The work meets the commission.',
            intent:
              'What {name} made exceeds what was specified. ' +
              'That difference lives in the world under {their} name.',
            effects: [
              {
                kind: 'spawn_artifact',
                category: 'mundane',
                tier: 'shaping',
                nameOverride: 'Commissioned Ironwork Panel Set',
                tags: ['#commission', '#ironwork', '#builders_fellowship'],
                messageOverride:
                  '{name} delivers the commissioned ironwork to a patron in {location}. ' +
                  'Three weeks of close work made permanent in metal.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'commission_quiet_flaw',
            label: 'The center escutcheon is off-spec. Passed as acceptable.',
            intent:
              'The deviation from specification is below what the client would catch. ' +
              '{name} know{s}. The deviation is in the world now.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.2,
                label: '{name} delivered commissioned ironwork in {location} with a dimensional deviation from specification',
                revealFamilies: ['bf.quest', 'bf.senior', 'investigation'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'commission_tally',
            label: 'Work delivered. Payment received.',
            intent: 'The commission is closed.',
            effects: [
              { kind: 'reputation_tally', key: 'stone.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  // ── Senior Quests (Journeyman+) ──────────────────────────────────

  withEncounterContract({
    id: 'bf.senior.raise_bridge',
    name: 'Raise a Bridge',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'stone',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 2,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        reach: 'stone',
        duration: { min: 3, max: 3 },
        difficulty: BF_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The crossing at {location} has been a seasonal ford for forty years — impassable ' +
          'six months of the year, marginally passable the other six. {name} walk{s} the banks ' +
          'twice before sitting down with the survey data. The bed narrows at the downstream ' +
          'end, which determines the arch span; the bank material on the east side is softer ' +
          'than the west, which determines the foundation depth differential. ' +
          '{?has_artifact}The load tables and reference drawings {name} carries are the ' +
          'difference between a design that can be checked and one that must be trusted on ' +
          'intuition — and a bridge should never be trusted on intuition alone.{/has_artifact}' +
          '{?no_artifact}Without formal reference materials, {name} work{s} the load estimates ' +
          'from first principles. This is how the old bridges were built, and also how some of ' +
          'them failed.{/no_artifact}',
        successAfterimage:
          'The arch form is settled: three-centered ellipse, precise formwork required. ' +
          '{name} note{s} this and continue{s}.',
        failureAfterimage:
          'The design has a structural weakness in the east abutment that the east bank\'s soil ' +
          'conditions will eventually find.',
      },
      {
        reach: 'stone',
        duration: { min: 3, max: 3 },
        difficulty: (BF_SENIOR_BASE + BF_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.06,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The crews are competent; the problem is the river. It run{s} high in the second week ' +
          'of construction, taking out the eastern coffer dam and setting the schedule back five days. ' +
          '{name} recalculate{s} the completion date and present{s} the revised figure to the ' +
          'commissioner without framing it as a surprise, because it is not one — anyone who has ' +
          'built over running water should expect this. ' +
          '{?has_artifact}The precision instruments allow real-time adjustment of the formwork ' +
          'as the arch rises — the curve is checked at each course, not assumed.{/has_artifact} ' +
          'The keystone go{es} in on a dry morning. {name} watch{es} the scaffolding come down.',
        successAfterimage:
          'The bridge stands. {name} walk{s} across it once, feeling the solidity in the arch ' +
          'transfer underfoot. Traffic will begin using it by tomorrow.',
        failureAfterimage:
          'The bridge stands. The eastern abutment has a slight set that will need monitoring ' +
          'over the first five years — the soft bank soil did what soft bank soil does.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} undertakes design and construction of a river crossing at {location}. ' +
        'The ford has been impassable for half of every year for forty years.',
      success:
        'The bridge stands. The ford is retired. Traffic moves in both directions without consulting the season.',
      failure:
        'The bridge stands, with a set in the eastern abutment that wants monitoring.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A bridge now spans the river at {location}. ' +
          'The crossing that was seasonal is now permanent. ' +
          'This changes the geometry of the roads around it.',
        changes: [
          {
            id: 'bridge_raised',
            kind: 'future_hook',
            title: 'Crossing Permanent',
            detail: 'A bridge changes the geography of a region. Routes that were seasonal are now continuous.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god note about the bridge and what it connects?',
        reactions: [
          {
            id: 'bridge_built',
            label: 'The crossing is permanent.',
            intent:
              'A bridge changes the geometry of the region. Routes that were seasonal are now continuous. ' +
              'That has consequences for everyone who uses the road.',
            effects: [
              {
                kind: 'spawn_artifact',
                category: 'mundane',
                tier: 'shaping',
                nameOverride: 'Stone River Bridge',
                tags: ['#structure', '#bridge', '#builders_fellowship'],
                messageOverride:
                  '{name} completes construction of a stone bridge at {location}. ' +
                  'The crossing is now year-round.',
              },
              {
                kind: 'encounter_seed',
                templateId: 'bf.social.material_trade',
                delayTicks: 15,
                seedLabel: 'A permanent crossing opens trade routes — commerce follows the road',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'bridge_abutment_note',
            label: 'The eastern abutment has a set worth tracking.',
            intent:
              'The set is within acceptable parameters, but {name} know{s} what caused it. ' +
              'The foundation soil on the east bank was softer than the probe suggested.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Eastern abutment of new {location} bridge has minor foundation set',
                detail:
                  'East bank soil 15% softer than survey probe indicated. Settlement should ' +
                  'stabilize; bridge is structurally safe but warrants re-check after the first spring flood.',
                reliability: 0.8,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'bridge_tally',
            label: 'The span is complete.',
            intent: 'The bridge is in the world. Whatever it connects, it connects now.',
            effects: [
              { kind: 'reputation_tally', key: 'stone.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'bf.senior.design_fortification',
    name: 'Design Fortifications',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'stone',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 2,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: BF_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The city\'s existing walls were laid in a different century by builders who ' +
          'prioritized speed over the threat model that exist{s} now. {name} walk{s} the ' +
          'perimeter in the early morning, when the light is low and shadow reveal{s} what ' +
          'the eyes edit during full light. ' +
          '{?has_artifact}The surveying instruments let {name} take precise angle measurements — ' +
          'three sections of the current wall are in dead ground relative to the main gate, ' +
          'an oversight older than anyone has bothered to document.{/has_artifact}' +
          '{?no_artifact}{name} note{s} the dead-ground sections by pacing and visual estimation. ' +
          'Precise enough for a preliminary study; the formal survey will confirm or adjust.{/no_artifact} ' +
          'The northern approach is the problem. It always was.',
        successAfterimage:
          'Three dead-ground sections documented with angle measurements. ' +
          'The north curtain gap is the one that wants addressing first.',
        failureAfterimage:
          'The perimeter walk identifies the main weaknesses. ' +
          'The north curtain angle measurement is approximate rather than precise.',
      },
      {
        reach: 'stone',
        duration: { min: 3, max: 3 },
        difficulty: (BF_SENIOR_BASE + BF_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.06,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The work plan draws on the site survey and three months of design iteration. ' +
          'The city council approved a modified version of the preferred plan — they removed ' +
          'the covered gallery on the north curtain wall for budget reasons, which is the section ' +
          'that matters most, but that decision is documented in the record and the alternatives ' +
          'were presented. {name} is not responsible for what the council chose not to build. ' +
          '{They} are responsible for building what they did approve, correctly. ' +
          '{name} walk{s} the site each morning. The stone go{es} where the plan says it go{es}.',
        successAfterimage:
          'The improvements are complete. The northern approach is harder than it was. ' +
          'The gap where the gallery was not built is visible to anyone who knows to look for it.',
        failureAfterimage:
          'The improvements are built. The construction issue on the western tower facing ' +
          'will need remediation before winter.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} study{ies} the defenses of {location} and prepare{s} a fortification improvement plan.',
      success:
        'The improvements are built. The northern approach is no longer the weak point it was.',
      failure:
        'The improvements are built. The budget modification to the north curtain gallery leaves a gap the design had addressed.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The fortification improvements are complete at {location}. ' +
          'What was built addresses most of the vulnerability. ' +
          'What was not built is on record.',
        changes: [
          {
            id: 'fortification_intel',
            kind: 'future_hook',
            title: 'Defenses Strengthened',
            detail: 'The city is more defensible than it was. The record shows what was built and what was removed from the plan.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god note about the fortifications and what they left unaddressed?',
        reactions: [
          {
            id: 'fortification_gap',
            label: 'The north curtain gallery removal left a real gap.',
            intent:
              'The council\'s budget decision created a vulnerability the original design had addressed. ' +
              'Someone who knows what to look for will see it.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Fortification blind spot at north curtain of {location} — budget modification removed gallery',
                detail:
                  'Council removed covered north gallery from the approved plan. ' +
                  'Dead-ground sector on the northern approach remains unaddressed. ' +
                  'A structured attack from that approach faces reduced resistance.',
                reliability: 0.9,
              },
              {
                kind: 'encounter_seed',
                templateId: 'bf.elite.grand_monument',
                delayTicks: 25,
                seedLabel: 'Fortification commission marks {name} as someone the city trusts with large projects',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'fortification_done',
            label: 'The improvements are complete.',
            intent: 'The city is more defensible than it was. The record is complete.',
            effects: [
              { kind: 'reputation_tally', key: 'stone.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'bf.senior.master_craft',
    name: 'Master Craft Challenge',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'stone',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 2,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        reach: 'stone',
        duration: { min: 2, max: 2 },
        difficulty: BF_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The Fellowship\'s quarterly challenge is open entry: any material, any form, ' +
          'judged on execution and intention. {name} stand{s} in the materials hall looking ' +
          'at the options the way someone does when {they} already know{s} what {they} will ' +
          'choose but are giving the alternatives a fair hearing. ' +
          'The iron stock in the back corner. The grain is right. ' +
          '{?has_artifact}The tools {name} carries have a relationship with iron — {they} ' +
          'know{s} what this hammer does to this medium, which changes what is possible.{/has_artifact}' +
          '{?no_artifact}The smithy\'s tools will do. The choice of medium is the choice that ' +
          'matters; the tools are secondary to the intent.{/no_artifact}',
        successAfterimage:
          'A bold concept. The judges\' reaction when {name} submits the material declaration ' +
          'is studied neutrality, which is more than they gave the ceramic entry.',
        failureAfterimage:
          'An uninspired concept. The iron stock is a safe choice, and the judges ' +
          'will evaluate it as what it is: safe.',
      },
      {
        reach: 'stone',
        duration: { min: 3, max: 3 },
        difficulty: (BF_SENIOR_BASE + BF_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.06,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.20, bestowed_power: 0.40 },
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'Three days. The piece develops by elimination — {name} remove{s} everything the ' +
          'iron does not need to say what it has to say. The judges will look for concept, ' +
          'but the concept is in the form, not in an explanation of it. The form has to earn ' +
          'the response on its own. ' +
          '{?has_artifact}The quality of {their} tools allows work at a precision the competition ' +
          'will not match with standard equipment — the edge definition is readable at a glance.{/has_artifact} ' +
          'The final session is the quiet hour before submission, when {name} see{s} the piece ' +
          'clearly for the first time and decides whether it is done or whether done is the best ' +
          'it is going to be.',
        successAfterimage:
          'The piece submitted. The judges handle it carefully, which say{s} something before ' +
          'the voting starts.',
        failureAfterimage:
          'The piece submitted. It is good work. It is not the best piece in the competition.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} enter{s} the Builders Fellowship craft challenge at {location}. ' +
        'Three days, any material, judged work.',
      success:
        'The piece submitted. The judges handle it carefully. That says something before the voting starts.',
      failure:
        'The piece submitted. Good work. Not the best in the competition.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The craft challenge is complete. What {name} made exists in the world now, ' +
          'carrying the question it was asking whether or not the judges answer it correctly.',
        changes: [
          {
            id: 'mastercraft_standing',
            kind: 'reputation_tally',
            title: 'Craft Standing',
            detail: 'A challenge piece speaks to the Fellowship\'s understanding of what {name} is capable of.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the piece and the challenge that produced it?',
        reactions: [
          {
            id: 'masterwork_placed',
            label: 'The piece is what {name} made it.',
            intent:
              'Whatever the judges decide, the piece exists. ' +
              'It carries {their} name and the question it was asking.',
            effects: [
              {
                kind: 'spawn_artifact',
                category: 'relic',
                tier: 'shaping',
                nameOverride: 'Fellowship Challenge Ironwork',
                tags: ['#masterwork', '#ironwork', '#builders_fellowship'],
                targetAgentId: '$actor',
                messageOverride:
                  '{name} completes a masterwork piece for the Builders Fellowship craft challenge ' +
                  'at {location}. Three days of close attention to what iron asks when asked nothing.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'masterwork_fell_short',
            label: 'The final hour revealed the limit.',
            intent:
              'The work was honest and the limit was real. ' +
              '{name} know{s} which hour it failed to be better — that knowledge is useful, and it cost something.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.2,
                label: '{name} submitted craft challenge work with a visible resolution limit on the primary form at {location}',
                revealFamilies: ['bf.senior', 'bf.elite'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'masterwork_tally',
            label: 'The piece speaks for itself.',
            intent: 'The challenge is over. The work enters the world now.',
            effects: [
              { kind: 'reputation_tally', key: 'stone.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  // ── Elite Quests (Master Builder+) ────────────────────────────────

  withEncounterContract({
    id: 'bf.elite.grand_monument',
    name: 'Raise a Grand Monument',
    rarityTier: 4,
    intrinsicTier: 'story_beat',
    reach: 'stone',
    crudType: 'create',
    scale: 'regional',
    locationSubtypes: ['city', 'capital'],
    apCost: 3,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        reach: 'stone',
        duration: { min: 3, max: 3 },
        difficulty: BF_ELITE_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.03 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The city council want{s} a monument to their founding generation — aspirational ' +
          'in scale, visible from the harbor. {name} spend{s} the first week reading the site: ' +
          'the angle of the morning light, the sightlines from the main boulevard, the way the ' +
          'hill rises behind the proposed location. A monument that does not work with its site ' +
          'is just large. ' +
          '{?has_artifact}The reference materials {name} carries include three case studies of ' +
          'civic monuments that failed on their sites — specific ways of failing are a better ' +
          'design guide than the successful ones.{/has_artifact}' +
          '{?no_artifact}The design develops from the site itself: what the hill offers, what ' +
          'the harbor sightline requires, what the morning light on the east face will do across ' +
          'a decade of seasons.{/no_artifact}',
        successAfterimage:
          'A design that work{s} with the hill rather than against it. ' +
          'The council review{s} it and approve{s} unanimously.',
        failureAfterimage:
          'A design that is ambitious but front-heavy — the upper register ' +
          'will dominate the profile in a way the site does not support.',
      },
      {
        reach: 'gold',
        duration: { min: 2, max: 2 },
        difficulty: (BF_ELITE_BASE + BF_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The design calls for white marble facing on the base courses and bronze detail work ' +
          'on the upper register. The marble comes from two quarries, one of which has been ' +
          'cutting that grade for thirty years and one of which has been cutting it for three. ' +
          '{name} visit{s} both. ' +
          'The older quarry cost{s} thirty percent more. The stone read{s} consistent at every ' +
          'depth sampled. {name} sign{s} with the older quarry. The choice will be invisible ' +
          'in the finished monument, which is the point of the choice.',
        successAfterimage:
          'Consistent marble secured. The supply contract is signed. ' +
          'The bronze foundry is scheduled for the following quarter.',
        failureAfterimage:
          'Supply constraints force a substitution in the lower courses. ' +
          'The variation will be subtle; it will be visible to someone with a trained eye.',
      },
      {
        reach: 'stone',
        duration: { min: 3, max: 3 },
        difficulty: (BF_ELITE_BASE + BF_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.08,
          rewardPool: {
            categoryWeights: { possession: 0.20, condition: 0.30, bestowed_power: 0.50 },
          },
        },
        failureMetadata: { reputationDelta: -0.03 },
        narrativeTemplate:
          'Fourteen months of site work. {name} is present for the first stone and for the last. ' +
          'In between: a labor dispute resolved in the third month, a frost-damage repair on the ' +
          'north face in month four, a scaffolding redesign when the upper course geometry did not ' +
          'match the drawings at elevation, and seventeen other things that will not appear in the ' +
          'public account of the project. ' +
          'The unveiling is civic ceremony. {name} stand{s} to one side and look{s} at the proportions. ' +
          'The north face light is correct. The harbor sightline is correct.',
        successAfterimage:
          'The monument stand{s} on the hill. The ratio works from the harbor, from the boulevard, ' +
          'from the side street {name} walked to check it the week before the unveiling.',
        failureAfterimage:
          'The monument stand{s}. The northeast corner geometry is a fraction off from the design intent — ' +
          'visible to someone holding the drawing, invisible to everyone else.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} undertakes design and construction of a civic monument in {location}. ' +
        'The city has a vision; the site has its own opinion about it.',
      success:
        'The monument stands on the hill. The harbor sightlines are correct. The light works.',
      failure:
        'The monument stands. The northeast corner geometry carries a deviation from the design intent.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A monument now stands at {location}. A structure of this scale changes how the city ' +
          'reads its own geography — it will be a landmark for the lifetime of the city, however long that is.',
        changes: [
          {
            id: 'monument_legacy',
            kind: 'future_hook',
            title: 'Monument Raised',
            detail: 'A landmark at this scale changes the city\'s sense of itself. It will be here longer than almost everything else.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god take from the monument and the fourteen months that made it?',
        reactions: [
          {
            id: 'monument_raised',
            label: 'The monument is in the world.',
            intent:
              'A structure of this scale changes how the city reads its own geography. ' +
              'It will be a landmark for the lifetime of the city.',
            effects: [
              {
                kind: 'spawn_artifact',
                category: 'relic',
                tier: 'legendary',
                nameOverride: 'Civic Monument of the Founders',
                tags: ['#monument', '#civic', '#builders_fellowship', '#landmark'],
                messageOverride:
                  '{name} completes construction of the civic monument at {location}. ' +
                  'Fourteen months of work made permanent. The harbor view now includes it.',
              },
              {
                kind: 'encounter_seed',
                templateId: 'bf.social.workshop_tour',
                delayTicks: 20,
                seedLabel: 'A monument at this scale becomes a destination — craftspeople come to study it',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'monument_standing',
            label: 'This will be here longer than {name} will.',
            intent:
              'The monument is the kind of work that defines a career. ' +
              'Whatever follows it follows from it.',
            effects: [
              { kind: 'reputation_tally', key: 'stone.positive', delta: 3 },
              { kind: 'reputation_tally', key: 'stone.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'bf.elite.engineer_wonder',
    name: 'Engineer a Wonder',
    rarityTier: 4,
    intrinsicTier: 'story_beat',
    reach: 'stone',
    crudType: 'create',
    scale: 'regional',
    locationSubtypes: ['capital'],
    apCost: 3,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        reach: 'eye',
        duration: { min: 3, max: 3 },
        difficulty: BF_ELITE_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.03 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The Grand Architect\'s challenge is not rhetorical: something not built before, ' +
          'in this city, in this material, at this scale. The qualification is serious. ' +
          'There are fifteen entries in the preliminary round; {name} review{s} the others\' ' +
          'proposals without commenting. ' +
          '{?has_artifact}The engineering reference texts {name} carries are full of failed ' +
          'proposals for novel structures — what failed and why is more useful than what succeeded.{/has_artifact}' +
          '{?no_artifact}The proposal develops from first principles, working outward from what ' +
          'the material can do to what no one has asked it to do yet.{/no_artifact} ' +
          'The proposal {name} submit{s} is for a covered market structure with a self-supporting ' +
          'ceramic tile vault, no interior columns. It has been attempted twice in the historical ' +
          'record; both attempts collapsed during construction.',
        successAfterimage:
          'An innovation that defies conventional wisdom. ' +
          'The calculus of shell behavior, which previous attempts got wrong, may now be correctly worked out.',
        failureAfterimage:
          'Too conventional. The Grand Architect returns the proposal with a single note: ' +
          '"This could have been built last century."',
      },
      {
        reach: 'stone',
        duration: { min: 3, max: 3 },
        difficulty: (BF_ELITE_BASE + BF_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.03 },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The calculation is not the problem; the problem is the formwork. The vault shape ' +
          'requires temporary support that can be removed after the tile is set, which means ' +
          'the formwork has to hold the tile in position during setting and then release without ' +
          'disturbing the set arch. {name} spend{s} six weeks on this sub-problem alone. ' +
          'The release sequence has to be precise — the previous attempts collapsed at this stage, ' +
          'not at the design stage. The design was correct; the construction method was not.',
        successAfterimage:
          'Every calculation check{s} out. The formwork release sequence is documented. ' +
          'The vault will stand — the math say{s} so, and the math has been checked three times.',
        failureAfterimage:
          'A fundamental flaw in the formwork release sequence. ' +
          'The wonder cannot be built as currently designed without solving this problem first.',
      },
      {
        reach: 'stone',
        duration: { min: 3, max: 3 },
        difficulty: (BF_ELITE_BASE + BF_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.08,
          rewardPool: {
            categoryWeights: { possession: 0.10, condition: 0.30, bestowed_power: 0.60 },
          },
        },
        failureMetadata: { reputationDelta: -0.03 },
        narrativeTemplate:
          'The construction goes in phases the engineers can observe and adjust. ' +
          '{name} build{s} the formwork system first, test{s} it with load, adjust{s} one ' +
          'joint sequence after the first section shows a different deflection than calculated. ' +
          'By the third section the method is understood. The fourth section goes in clean. ' +
          'The formwork comes out. {name} walk{s} under the vault and does not look up for a long time.',
        successAfterimage:
          'The vault stand{s} without interior columns. The light inside it move{s} the way ' +
          '{name} calculated it would — a different quality than any covered market in the city.',
        failureAfterimage:
          'The third section has a visible deviation from the design geometry — within structural ' +
          'tolerance, outside aesthetic tolerance. The wonder stand{s}, but not perfectly.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} undertakes to build something that has not been built before in {location}. ' +
        'The engineering is claimed to work. Now it has to.',
      success:
        'The vault stands without interior columns. The light inside it moves the way the calculations said it would.',
      failure:
        'The vault stands. The third section carries a visible deviation from the design geometry.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The wonder has been built at {location}. ' +
          'What could not be built has been built. ' +
          'That changes what other builders will believe is possible.',
        changes: [
          {
            id: 'wonder_built',
            kind: 'future_hook',
            title: 'Something New in the World',
            detail: 'A structural form that did not exist before now exists. That fact is independent of the quality of this specific execution.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god take from the vault and the knowledge that produced it?',
        reactions: [
          {
            id: 'wonder_raised',
            label: 'The vault stands without columns.',
            intent:
              'What could not be built has been built. ' +
              'That fact changes what other builders will attempt.',
            effects: [
              {
                kind: 'spawn_artifact',
                category: 'relic',
                tier: 'legendary',
                nameOverride: 'Columnless Ceramic Vault Market',
                tags: ['#wonder', '#vault', '#builders_fellowship', '#innovation'],
                messageOverride:
                  '{name} completes construction of the tile vault market at {location} — ' +
                  'no interior columns, self-supporting, a structural form not previously built at this scale.',
              },
              {
                kind: 'encounter_seed',
                templateId: 'bf.senior.master_craft',
                delayTicks: 20,
                seedLabel: 'A structural innovation at this scale draws craftspeople to study and attempt variations',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'wonder_method_documented',
            label: 'The failure analysis exists now, and only {name} holds it.',
            intent:
              'The two previous failed attempts are now three failed attempts, except this one did not fail. ' +
              '{name} know{s} why the others collapsed and why this one did not.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Method for constructing self-supporting ceramic vault without interior columns, proven at {location}',
                detail:
                  'Formwork release sequence is the critical variable — previous attempts failed at this stage. ' +
                  'Documented method for joint sequencing and deflection adjustment now exists.',
                reliability: 0.95,
              },
              { kind: 'reputation_tally', key: 'stone.positive', delta: 4 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Social Encounters ─────────────────────────────────────────────────────

export const BUILDERS_FELLOWSHIP_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [
  withEncounterContract({
    id: 'bf.social.workshop_tour',
    name: 'Workshop Tour',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'stone',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        reach: 'stone',
        duration: { min: 1, max: 1 },
        difficulty: (BF_DIFFICULTY_BASE - 5) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
          },
        },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The master\'s workshop run{s} off the south lane, identifiable by the smell of oil ' +
          'and the sound of a wheel-lathe that has been running since before {name} arrived. ' +
          'The tour is informal: the master narrate{s} when something is interesting and does not ' +
          'narrate when it is not. {name} keep{s} pace and hold{s} {their} questions until the end. ' +
          '{?has_artifact}The tools {name} carries are close enough to the work being shown that ' +
          '{they} can ask comparative questions rather than explanatory ones — the conversation ' +
          'move{s} faster, go{es} deeper.{/has_artifact}' +
          '{?no_faction}The master does not know {name} yet. The tour is what it is given to ' +
          'new visitors: complete, but not inside.{/no_faction}',
        successAfterimage:
          'The lamination method in the third room is not in any published reference. ' +
          '{name} file{s} it carefully.',
        failureAfterimage:
          'The master is occupied with a deadline. The tour is brief and the third room is skipped.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} visit{s} a master\'s workshop in {location}. ' +
        'The techniques on display are worth an afternoon.',
      success:
        'The tour gave {name} something specific to think about. The lamination method alone was worth the walk.',
      failure:
        'The master was occupied. A brief tour; the interesting rooms were skipped.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The workshop tour is complete. What {name} observed will inform future work — ' +
          'some of it immediately, some of it years from now.',
        changes: [
          {
            id: 'workshop_learning',
            kind: 'growth',
            title: 'Technique Observed',
            detail: 'Watching good work is the second-best way to learn it.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god take from what {name} saw in the workshop?',
        reactions: [
          {
            id: 'workshop_technique',
            label: 'The lamination method in the third room is not in any published reference.',
            intent:
              'The master is using a technique {name} has not seen before. ' +
              'Watching is not the same as understanding; understanding will take more than this afternoon.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Undocumented wood lamination technique observed at workshop in {location}',
                detail:
                  'Layered cross-grain assembly with staggered joint placement — no published reference found. ' +
                  'Master attributes it to a journeyman apprenticeship in a coastal city. ' +
                  'Structural application promising.',
                reliability: 0.6,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'workshop_tally',
            label: 'The tour was worth the afternoon.',
            intent: 'The visit gave {name} something to think about.',
            effects: [
              { kind: 'reputation_tally', key: 'stone.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'bf.social.guild_feast',
    name: 'Guild Feast',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: (BF_DIFFICULTY_BASE - 10) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The feast is in the Hall on the longest guild day of the year — the celebration ' +
          'of a completed bridge, this time, the one that opened the northern market route. ' +
          'Everyone is in a better mood than usual, which is noticeable because the usual mood ' +
          'is not bad but is not particularly festive either. ' +
          '{name} find{s} a place at the long table and eat{s}. ' +
          'The Fellowship trade{s} work stories the way other people trade gossip — ' +
          'what held up a foundation pour, what the commissioners never understand about curing time, ' +
          'what the younger apprentices are doing wrong that everyone did wrong once.',
        successAfterimage:
          'The master beside {name} described a commission that might fit {their} current capacity. ' +
          'The conversation was informal; nothing was offered.',
        failureAfterimage:
          '{name} arrive{s} late. The good seats are taken. ' +
          'The conversation has already moved past introductions.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} attends the Builders Fellowship feast at {location}. ' +
        'The guild is celebrating a completed project.',
      success:
        'Good food and the right company. A commission possibility surfaced, informally.',
      failure:
        '{name} arrived late. The feast was what it was from the remaining seats.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The guild feast is done. {name} spent an evening with the Fellowship, ' +
          'which is not nothing — the Fellowship functions on the accumulated weight of these evenings.',
        changes: [
          {
            id: 'feast_standing',
            kind: 'reputation',
            title: 'Fellowship Presence',
            detail: 'Showing up matters. The Fellowship counts the people who show up.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god note from the feast and its conversations?',
        reactions: [
          {
            id: 'feast_commission_lead',
            label: 'The master beside {name} described a commission that fits.',
            intent:
              'A chance conversation at a table. Nothing formal, nothing binding — ' +
              'just a direction in which to follow up.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'bf.quest.craft_commission',
                delayTicks: 8,
                seedLabel: 'A feast conversation may lead to a commission introduction',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'feast_tally',
            label: 'Good food and the right company.',
            intent: 'The feast was what it was supposed to be.',
            effects: [
              { kind: 'reputation_tally', key: 'stone.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'bf.social.material_trade',
    name: 'Material Trading',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'gold',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        reach: 'gold',
        duration: { min: 1, max: 1 },
        difficulty: BF_DIFFICULTY_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.50 },
          },
        },
        failureMetadata: { reputationDelta: 0 },
        narrativeTemplate:
          'The Fellowship\'s informal trading floor run{s} on the first morning of every quarter — ' +
          'members bringing surplus, looking for what they are short of. ' +
          '{name} arrive{s} with a specific list and an hour to work it. ' +
          '{?has_artifact}Having quality tools to trade as reference samples change{s} the conversation — ' +
          'craftspeople evaluate {name}\'s surplus partly by what {they} are willing to part with.{/has_artifact} ' +
          'The floor is noisy in a particular way: not the noise of argument but the noise of ' +
          'people who know what they need and are trying to find it efficiently.',
        successAfterimage:
          'The trade was fair. What {name} came with was exchanged for what {they} needed.',
        failureAfterimage:
          'Nothing on the list was available today. The surplus {name} brought is still in {their} pack.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} attend{s} the Fellowship\'s quarterly material trading floor in {location}. ' +
        'Surplus for surplus; the fellowship functions on this exchange.',
      success:
        'The trade was fair. What {name} needed was found; what {they} had surplus of went to someone who needed it.',
      failure:
        'Nothing on the list was available. The floor was thin today.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The quarterly trade floor is complete. {name} has either found what was needed ' +
          'or learned something about what is currently scarce.',
        changes: [
          {
            id: 'trade_standing',
            kind: 'reputation',
            title: 'Fellowship Exchange',
            detail: 'The Fellowship functions because these transactions are generally honest.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god note from the trading floor and its supply signals?',
        reactions: [
          {
            id: 'trade_scarcity',
            label: 'The good bronze stock is gone. Someone took it all early.',
            intent:
              'A specific material scarcity this quarter may have reasons beyond normal demand. ' +
              'Someone is either preparing for a large commission or stockpiling.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Bronze stock unusually depleted at Fellowship trade floor in {location}',
                detail:
                  'All quality bronze stock purchased early in the trading period — quantity exceeds ' +
                  'normal individual-project use. Either a large commission absorbed it or someone is stockpiling.',
                reliability: 0.5,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'trade_tally',
            label: 'The trade was fair.',
            intent: 'The exchange is complete. The fellowship functions because these transactions are generally honest.',
            effects: [
              { kind: 'reputation_tally', key: 'stone.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Join & Promotion ──────────────────────────────────────────────────────

export const BF_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'bf.join',
  name: 'Apply to the Fellowship',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  reach: 'stone',
  crudType: 'update',
  scale: 'local',
  locationSubtypes: ['town', 'city', 'capital'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
  steps: [
    {
      reach: 'stone',
      duration: { min: 1, max: 1 },
      difficulty: BF_JOIN_DIFFICULTY / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: { reputationDelta: 0.0 },
      failureMetadata: { reputationDelta: 0.0 },
      narrativeTemplate:
        'The Fellowship\'s craft test is not theatrical — a table, raw stock, two journeymen ' +
        'observers, and however long the candidate needs. {name} is given iron stock and asked ' +
        'to produce a functional fitting of {their} choice. ' +
        '{?has_artifact}Arriving with personal tools is expected at this level of craft — the ' +
        'Fellowship is assessing the work, not the willingness to use whatever is at hand. ' +
        '{name}\'s tools are noted without comment.{/has_artifact}' +
        '{?no_artifact}The smithy\'s tools are available and adequate. The Fellowship has seen ' +
        'people pass this test with borrowed equipment before; it is not the tools being assessed.{/no_artifact} ' +
        '{name} work{s}. The observers do not comment.',
      successAfterimage:
        'The fitting is examined, turned over, examined again. ' +
        'One of the journeymen nod{s}. "Welcome to the Fellowship."',
      failureAfterimage:
        '"Come back when the joinery is cleaner." ' +
        'A specific critique, at least — not a generalized dismissal.',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name} arrives at the Builders Fellowship workshop in {location} ' +
      'to take the craft qualification test.',
    success:
      'The test passed. The Fellowship has a new member.',
    failure:
      'The test did not pass. A specific note was given. {name} know{s} what to work on.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The application test is complete. {name} either join{s} the Fellowship today ' +
        'or return{s} when the work is cleaner.',
      changes: [
        {
          id: 'join_outcome',
          kind: 'reputation',
          title: 'Fellowship Application',
          detail: 'The test is what it is. The work spoke.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'What does the god note about {name}\'s first encounter with the Fellowship?',
      reactions: [
        {
          id: 'join_accepted',
          label: '{name} is a Fellow.',
          intent: 'The apprenticeship begins formally. The guild has a record of this.',
          effects: [
            { kind: 'reputation_tally', key: 'stone.positive', delta: 1 },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const BF_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'bf.promotion',
  name: 'Fellowship Advancement',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'stone',
  crudType: 'update',
  scale: 'local',
  locationSubtypes: ['town', 'city', 'capital'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
  steps: [
    {
      reach: 'stone',
      duration: { min: 2, max: 2 },
      difficulty: BF_PROMOTION_DIFFICULTY / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: { reputationDelta: 0.0 },
      failureMetadata: { reputationDelta: 0.0 },
      narrativeTemplate:
        'Portfolio review is different from the initial test — it is an argument made with ' +
        'finished work, not a demonstration of basic capability. {name} bring{s} the pieces ' +
        '{they} think make the case: a repaired section from the north ward commission, the ' +
        'survey plans from the market district project, two pieces of decorative ironwork. ' +
        '{?has_artifact}The quality of {their} tools is readable in the work — a consistent ' +
        'standard across different pieces, different materials, different problems.{/has_artifact}' +
        '{?no_artifact}The work has to speak clearly because there is nothing external to point to. ' +
        '{name} let{s} the portfolio do the talking.{/no_artifact} ' +
        'The masters examine each piece without comment. The examination takes two hours.',
      successAfterimage:
        'The masters confer for nine minutes. The outcome is in the guild ledger, ' +
        'and in the particular way the senior master shake{s} {their} hand — like something was settled.',
      failureAfterimage:
        'The masters point to the second ironwork piece. The proportion decision in the center panel ' +
        'is where {name} made the case for the wrong things. Come back in six months.',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name} present{s} a portfolio review to the Builders Fellowship masters in {location}.',
    success:
      'The rank has changed. The fellowship treats {name} differently now — not a lot, but specifically.',
    failure:
      'The portfolio was reviewed. The second ironwork piece did not make the case the rest of the work did.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The portfolio review is complete. The masters reached a decision about {name}\'s advancement — ' +
        'and gave a specific reason for it, which is more useful than a general one.',
      changes: [
        {
          id: 'promotion_outcome',
          kind: 'reputation_tally',
          title: 'Advancement Review',
          detail: 'The masters assessed the body of work. The proportion decision in the ironwork was noted.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'What does the god take from the portfolio and the masters\' judgment?',
      reactions: [
        {
          id: 'promotion_advanced',
          label: 'The rank has changed.',
          intent:
            'The promotion is formal and recorded. ' +
            'The Fellowship treat{s} {name} differently now — not dramatically, but specifically.',
          effects: [
            { kind: 'reputation_tally', key: 'stone.positive', delta: 2 },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'promotion_critique',
          label: 'The masters identified the weak piece.',
          intent:
            'The critique was specific and correct. That is useful regardless of the outcome.',
          effects: [
            { kind: 'reputation_tally', key: 'stone.positive', delta: 1 },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const BF_LIFECYCLE_TEMPLATES: readonly UnifiedActionTemplate[] = [
  BF_JOIN_TEMPLATE,
  BF_PROMOTION_TEMPLATE,
];

// ─── Lookup ───────────────────────────────────────────────────────────────

/**
 * Look up a Builders Fellowship encounter template by ID.
 */
export function getBuildersFellowshipEncounterById(id: string): UnifiedActionTemplate | undefined {
  return BUILDERS_FELLOWSHIP_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? BF_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? BUILDERS_FELLOWSHIP_SOCIAL_TEMPLATES.find(t => t.id === id);
}
