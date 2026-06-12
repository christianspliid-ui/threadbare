/**
 * Social Encounter Content Package — 14 social encounter templates.
 *
 * Migrated to UnifiedActionTemplate (THR-100, Phase 3).
 * 14 main templates / ~32 steps rewritten to Threadbare-aesthetic prose
 * (relational, pressure-tempered, subtextual register) with contextual
 * aftermath: encounter seeds (9/14), hidden marks (6/14), reputation tallies,
 * and ActionStepBranch leverage forks (4/14).
 *
 * Pattern parents: THR-89 (Thieves Guild), THR-93 (Builders Fellowship).
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Edit this file to change social encounter templates,
 * step sequences, difficulty curves, and narrative prose.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';

// ─── Difficulty Constants (0–1 normalized) ────────────────────

const SD_BASE = 0.30;  // social difficulty base
const SD_STEP = 0.10;  // social difficulty increment per tier

// ─── Settlement Location Subtypes ────────────────────────────

const SETTLEMENT_LOCATIONS = ['hamlet', 'town', 'city', 'capital'] as const;

// ─── 14 Social Encounter Templates ───────────────────────────

export const SOCIAL_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [

  // ── 1. Forge Alliance ───────────────────────────────────────

  {
    id: 'social.forge_alliance',
    name: 'Forge Alliance',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: [...SETTLEMENT_LOCATIONS],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'heart',
        duration: { min: 2, max: 2 },
        difficulty: SD_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.06 },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The first thing {name} does is find a table where neither of them has their back to the room. ' +
          'Not a gesture of trust — a gesture of sense, and the other party reads it that way. ' +
          '{?has_faction}The faction seal on {their} shoulder-clasp says something before {they} speak{s}. ' +
          'In places like {location}, symbols do half the work.{/has_faction}' +
          '{?no_faction}{name} is unaffiliated and both of them know it — which means ' +
          'this conversation stands entirely on what {they} say{s} and how {they} say{s} it.{/no_faction}',
        successAfterimage:
          'The other party holds {their} cup two-handed — a sitting-down posture, not a standing-up one. ' +
          'The conversation has found a register that both of them can work with.',
        failureAfterimage:
          '{name}\'s opening read the room wrong — too formal, or not formal enough. ' +
          'The other party is still here, but the temperature in the conversation has dropped.',
      },
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: SD_BASE + SD_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#heart'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.03,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#heart'],
          },
        },
        narrativeTemplate:
          'Terms. This is where most overtures fail — not from bad faith, but from the gap between ' +
          'what each party is willing to give and what they are willing to say they are willing to give. ' +
          '{name} read{s} the prior exchange carefully and names what {they} need{s} first, ' +
          'plainly, without softening it with precedent or flattery. ' +
          '{?has_ally}There is a mutual acquaintance — {ally:strongest} has worked with both sides. ' +
          '{name} invoke{s} that name once, not as leverage, but as context.{/has_ally}',
        successAfterimage:
          'Something shifts in the way they hold themselves across from {name} — not deference, ' +
          'but the particular attention people give to someone they have decided to take seriously. ' +
          'The pact is not yet written, but it is already understood.',
        failureAfterimage:
          'The terms prove too different. Not enemies — just two parties whose interests ' +
          'don\'t overlap enough for a binding agreement. {name} walk{s} out with the sense ' +
          'that the problem is solvable, but not today.',
        criticalSuccessAfterimage:
          'The pact is written in the hour rather than across weeks. Both parties find more overlap than expected — ' +
          'the terms settle not just into agreement but into something warmer: a mutual recognition that this was useful, ' +
          'which is the foundation everything else gets built on.',
        successAtCostAfterimage:
          'The alliance holds, but one concession was larger than it should have been. ' +
          '{name} gave something away in the closing that the other party will not forget they gave. ' +
          'The pact is real. The leverage inside it is not equally distributed.',
        criticalFailureAfterimage:
          'The terms do not just fail to overlap — they actively contradict. The other party leaves with the clear impression ' +
          'that {name}\'s interests and theirs will eventually require choosing between them. ' +
          'That impression will travel.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} has arranged to meet a potential ally in {location}. The overture is intentional. ' +
        'Whether it goes anywhere depends on the next hour.',
      success:
        'An alliance is formed. Both parties know what they are now obligated to, and what they can ask.',
      failure:
        'The meeting was not a disaster — it simply didn\'t build to anything binding.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'An alliance meeting in {location}. Whether it held or collapsed, the other party now has a clearer ' +
          'sense of who {name} is and what {they} want{s}.',
        changes: [
          {
            id: 'alliance_standing',
            kind: 'reputation',
            title: 'Alliance Standing',
            detail: 'The other party has updated their read on {name}. Trust is either forming or was tested and found wanting.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note about the new relationship, or the failure to form one?',
        reactions: [
          {
            id: 'forge_alliance_seed_ally',
            label: 'The alliance takes root. The new ally will call on {name}.',
            intent:
              'The relationship is real. Obligations follow. At some future point, ' +
              'the ally will need something — and the request will not be optional.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'social.forge_alliance',
                delayTicks: 24,
                seedLabel: 'New ally calls in a favor from {name}',
              },
              { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'forge_alliance_seed_grudge',
            label: 'The overture failed — and the other party remembers it.',
            intent:
              'Being approached and turned away leaves a mark. The other party will encounter {name} again, ' +
              'with the memory of this conversation intact.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'social.investigate_reputation',
                delayTicks: 18,
                seedLabel: 'Slighted party studies {name}\'s reputation before the next meeting',
              },
              { kind: 'reputation_tally', key: 'heart.negative', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 2. Recruit to Faction ────────────────────────────────────

  {
    id: 'social.recruit_faction',
    name: 'Recruit to Faction',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: [...SETTLEMENT_LOCATIONS],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        reach: 'heart',
        duration: { min: 2, max: 2 },
        difficulty: SD_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.04 },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          '{name} watches the prospect before speaking — the way they carry their frustration, ' +
          'whether it is the restless kind that wants direction or the resolved kind that has already ' +
          'decided to stay exactly where they are. You cannot recruit the second type. ' +
          '{?has_faction}The faction {name} represents has something concrete to offer: ' +
          'purpose, protection, identity in {location}. {They} lead{s} with that.{/has_faction}' +
          '{?no_faction}Without institutional weight behind the offer, {name} has to make it ' +
          'personal — what specifically does this person want, and what can {they} deliver{s}.{/no_faction}',
        successAfterimage:
          'The prospect doesn\'t commit — but {they} lean{s} forward. That\'s enough for the second conversation.',
        failureAfterimage:
          'The prospect is polite but distant. They\'ve heard this kind of offer before, ' +
          'and something in {name}\'s approach told them this one was the same.',
      },
      {
        reach: 'shadow',
        duration: { min: 3, max: 3 },
        difficulty: SD_BASE + SD_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.07,
          tierPromotionEligible: true,
        },
        failureMetadata: { reputationDelta: -0.04 },
        narrativeTemplate:
          'The induction is not a ceremony. It is a conversation that ends with a commitment, ' +
          'and both parties know what that commitment costs. {name} is careful with the words — ' +
          'not careful as in gentle, careful as in precise. The prospect needs to know what they are ' +
          'saying yes to before they say it, because the cost of a half-convinced member is higher ' +
          'than the cost of a declined offer.',
        successAfterimage:
          'The oath is spoken quietly. {name} nods once — the new member has been told ' +
          'what they are owed and what is owed from them. The group is larger by one.',
        failureAfterimage:
          'At the final commitment, something closes in the prospect\'s expression. ' +
          'Not anger — doubt, which is worse. {They} decline{s} and it is the right call. ' +
          '{name} can see that now and wish{s} {they} had seen it twenty minutes earlier.',
        criticalSuccessAfterimage:
          'The new member joins with more conviction than the script called for. ' +
          'By the end they are not just committed — they are eager, which is a different resource entirely. ' +
          '{name} notes the particular quality of their readiness.',
        successAtCostAfterimage:
          'The oath is spoken, but the new member asked one question at the end that revealed how much they understood ' +
          'about what they were joining. The answer {name} gave was honest. The cost of that honesty will arrive later.',
        criticalFailureAfterimage:
          'The prospect does not simply decline — they say why, plainly, in a way that captures ' +
          'something real about the offer\'s weakness. {name} has heard a critique they will have to carry ' +
          'for a while before they can set it down.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} has identified a prospect worth recruiting in {location}. ' +
        'The approach is deliberate — half recruitment, half evaluation.',
      success:
        'A new member joins. The oath is less important than the decision behind it.',
      failure:
        'The recruitment did not hold. The prospect stays outside.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A recruitment attempt in {location}. The prospect now has a clearer sense of the faction and of {name}.',
        changes: [
          {
            id: 'recruit_standing',
            kind: 'reputation',
            title: 'Recruitment Record',
            detail: 'Success adds a member and builds {name}\'s reputation as someone worth joining. Failure leaves the prospect wary.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note about the new member, or the failed approach?',
        reactions: [
          {
            id: 'recruit_seed_initiation',
            label: 'The new member is in — and the faction is watching how {name} handles it.',
            intent:
              'New members create new obligations. The faction has expectations of {name} as the recruiter, ' +
              'and the new member will test both sides of the relationship early.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'social.establish_patronage',
                delayTicks: 18,
                seedLabel: 'New member seeks guidance from {name} — the recruiter\'s first obligation',
              },
              { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'recruit_seed_rejection',
            label: 'The prospect declined — and will tell others why.',
            intent:
              'A failed recruitment in a community like {location} travels. ' +
              'The prospect\'s reasons for declining will shape how the faction is perceived.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'reputation_note',
                severity: 0.2,
                label: 'Failed recruitment — prospect cited doubts about {name}\'s pitch',
                revealFamilies: ['social.investigate_reputation', 'social.political_leverage'],
              },
              { kind: 'reputation_tally', key: 'heart.negative', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 3. Investigate Reputation ────────────────────────────────

  {
    id: 'social.investigate_reputation',
    name: 'Investigate Reputation',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: [...SETTLEMENT_LOCATIONS],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: SD_BASE - SD_STEP,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.03 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{name} asks about the subject the way you ask about water in a strange town — ' +
          'casually, with no apparent stake in the answer. The market in {location} is a good place ' +
          'for this. People describe what they\'ve seen without offering opinions, ' +
          'and sometimes the gap between the two is where the truth lives. ' +
          '{?has_faction}Faction connections help: {they} know{s} which sources ' +
          'in {location} run clean and which embellish.{/has_faction}' +
          '{?no_faction}{name} has no existing relationships to lean on here. ' +
          '{They} piece{s} things together from strangers, which means accounting for every bias.{/no_faction}',
        successAfterimage:
          'Three separate accounts of the same event. Two of them match well enough to treat as fact. ' +
          'The third is interesting precisely because it doesn\'t.',
        failureAfterimage:
          'The market is tight-lipped today. {name} get{s} opinions, not observations — ' +
          'every source is running a version of the subject through their own interest.',
      },
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: SD_BASE,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#knowledge'],
          },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{name} checks one account against another — not for verification, ' +
          'but for the kind of contradiction that only appears when someone is constructing a story. ' +
          '{?has_ally}A connection in {location} helps: {ally:strongest} has shared ' +
          'history with the subject and will give {name} the straight read.{/has_ally}' +
          'What {they} find{s} is either a coherent picture of a real person, or a coherent picture ' +
          'of a person someone wanted others to see.',
        successAfterimage:
          '{name} now knows what is true about the subject and what is managed. ' +
          'The gap between them is information that does not appear in any single account.',
        failureAfterimage:
          'The cross-reference produces more questions than answers. ' +
          'The subject is either genuinely complicated or very careful — {name} can\'t yet say which.',
        criticalSuccessAfterimage:
          'The gap is larger than {name} expected, and the managed version more actively maintained. ' +
          'The subject is not complicated — they are careful in a way that requires daily effort. ' +
          '{name} now holds something they will have to decide what to do with.',
        successAtCostAfterimage:
          '{name} now has the picture — but the asking left traces. One source hesitated before speaking; ' +
          'another glanced toward the wrong part of the room. The investigation was productive. ' +
          'The subject may know it was conducted.',
        criticalFailureAfterimage:
          'The cross-reference does not just fail — it reveals that the subject is aware of being examined. ' +
          'The accounts are too consistent, too clean. Someone has been preparing this version ' +
          'for exactly this kind of inquiry, and {name} has announced the inquiry by conducting it.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is building a picture of someone in {location} from public fragments. ' +
        'The method is quiet. The question is what the evidence actually shows.',
      success:
        'The subject\'s reputation is mapped — what is performed and what is real.',
      failure:
        'The picture remains incomplete. The subject is less legible than {name} hoped.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A reputation investigation in {location}. {name} now knows more about the subject — ' +
          'or has confirmed how much is deliberately obscured.',
        changes: [
          {
            id: 'investigation_record',
            kind: 'reputation',
            title: 'Investigation Record',
            detail: 'What was found during the inquiry shapes how {name} reads this subject in future encounters.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'What did {name} learn? And what does the god mark as signal versus noise?',
        reactions: [
          {
            id: 'investigate_intel_concrete',
            label: 'A credible vulnerability: a debt, a grudge, a lie that could be exposed.',
            intent:
              'The investigation surfaced something useful — specific, actionable, and not yet widely known.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Reputation investigation: credible vulnerability on subject in {location}',
                detail:
                  'Cross-referenced accounts reveal a specific inconsistency the subject is managing — ' +
                  'a past debt or obligation that affects their standing if surfaced.',
                reliability: 0.75,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'investigate_intel_network',
            label: 'The subject has allies or rivals {name} didn\'t know about.',
            intent:
              'The inquiry revealed that the subject\'s real position in {location} is shaped by ' +
              'relationships that don\'t appear on the surface.',
            effects: [
              {
                kind: 'intelligence',
                category: 'agent_network',
                label: 'Reputation investigation: hidden alliance or enmity network around subject',
                detail:
                  'The subject maintains connections — allies who owe them, or rivals who are watching for weakness. ' +
                  'These relationships are not publicly announced but influence their every decision.',
                reliability: 0.65,
              },
              {
                // Reputation work compounds: prior agent_network intel sharpens
                // the read of who really owes whom in {location}.
                kind: 'intel_referenced_prose',
                category: 'agent_network',
                prose: {
                  reliable: '{name} moved through the introductions with the surety of someone who had already drawn the map of who knew whom.',
                  uncertain:
                    '{name} arrived with names that had been right once — most still were, and the conversations found their way through the gaps in the map.',
                  dubious:
                    '{name} introduced herself by names that no longer carried weight here — the social order had shifted in ways the dossier had not been told about.',
                },
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 4. Spy On ────────────────────────────────────────────────

  {
    id: 'social.spy_on',
    name: 'Spy On',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: [...SETTLEMENT_LOCATIONS],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'shadow',
        duration: { min: 1, max: 2 },
        difficulty: SD_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.03 },
        narrativeTemplate:
          '{name} fold{s} {themselves} into {location} the way experienced watchers do — ' +
          'by occupying the part of the scene where looking is expected. A stall, a doorway, ' +
          'the kind of idle that reads as purpose. The target moves in predictable patterns, ' +
          'or they don\'t. {?has_faction}Guild intelligence has flagged this target already — ' +
          '{name} know{s} their likely routes, which cuts the initial surveillance time in half.{/has_faction}' +
          '{?no_faction}No preparation except what {name} assembled from public presence. ' +
          'The first hour is about building a baseline, not drawing conclusions.{/no_faction}',
        successAfterimage:
          'The target visits the same location twice before midday. They are meeting someone ' +
          'they don\'t want associated with their public business. {name} note{s} the face.',
        failureAfterimage:
          'The target changes their pattern mid-morning — either chance or someone tipped them. ' +
          '{name} pull{s} back before the window closes entirely.',
      },
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: SD_BASE + SD_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
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
          'The patterns {name} has catalogued now have to mean something. ' +
          '{They} sort{s} them: contacts, habits, times when the target is alone and unguarded, ' +
          'times when they are performing. The distance between those two states is where ' +
          'everything useful lives. {name} look{s} for what the target is protecting rather than ' +
          'what they are doing — the thing that explains the routing and the secrecy.',
        successAfterimage:
          '{name} depart{s} with intelligence that is specific enough to act on: a name, ' +
          'a location, a vulnerability the target is actively managing. ' +
          'The kind of knowledge that changes how the target can be approached.',
        failureAfterimage:
          'The intelligence is thin — suggestive but not actionable. {name} has observations ' +
          'but not conclusions. Something important happened that {they} was{s} not positioned to see.',
        criticalSuccessAfterimage:
          '{name} depart{s} with something the target could not afford to have seen: not a name or a location, ' +
          'but the relationship between them — the weight of obligation in the way they said goodbye, ' +
          'the direction they looked before leaving. The intelligence maps a structure, not just a fact.',
        successAtCostAfterimage:
          '{name} has the intelligence, but the extraction was not clean. ' +
          'The position {they} chose left a trace — a face noticed, a moment too long in a doorway. ' +
          'The data is good. The cover may not be.',
        criticalFailureAfterimage:
          'The target changed their pattern because they saw {name} first — not just spotted: assessed and catalogued. ' +
          '{name} now appears in whatever account the target is building, ' +
          'and that account is being built with more care than the surveillance that triggered it.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is running surveillance on a target in {location}. ' +
        'The goal is specific intelligence, not general knowledge.',
      success:
        'The surveillance produced something concrete. {name} knows something the target didn\'t intend to reveal.',
      failure:
        'The opportunity closed before it fully opened. The intelligence gathered is inconclusive.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Surveillance on a target in {location}. Either {name} extracted specific intelligence, ' +
          'or the attempt left traces that could surface.',
        changes: [
          {
            id: 'spy_record',
            kind: 'reputation',
            title: 'Surveillance Record',
            detail: 'Successful surveillance gives {name} a concrete advantage. Spotted surveillance creates a mark that could be traced.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What specifically did {name} learn — or what did the target notice?',
        reactions: [
          {
            id: 'spy_intel_vulnerability',
            label: 'The target has a specific vulnerability: a debt, a secret contact, a location they guard.',
            intent:
              'The surveillance was productive. {name} now holds information the target would pay to suppress.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Surveillance result: specific vulnerability on target in {location}',
                detail:
                  'Direct observation revealed the target maintains a relationship or obligation that is not public. ' +
                  'The contact\'s identity, meeting location, or transaction nature was recorded.',
                reliability: 0.85,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'spy_intel_military',
            label: 'The target moves with purpose — military or faction coordination is likely.',
            intent:
              'The surveillance revealed organizational patterns: the target is coordinating something larger than personal business.',
            effects: [
              {
                kind: 'intelligence',
                category: 'military_position',
                label: 'Surveillance result: target coordinates faction or military movements from {location}',
                detail:
                  'The target\'s contacts and meeting times suggest they are acting as a coordination point ' +
                  'for faction or military activity. The nature and scale are as yet unclear.',
                reliability: 0.6,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'spy_spotted',
            label: 'The target noticed the surveillance. {name}\'s presence was logged.',
            intent:
              'The target is careful and something triggered their attention. ' +
              '{name} will be a known variable next time they cross paths.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.45,
                label: 'Spotted conducting surveillance on target in {location}',
                revealFamilies: ['social.investigate_reputation', 'social.political_leverage', 'social.intimidate'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 5. Negotiate Deal ────────────────────────────────────────

  {
    id: 'social.negotiate_deal',
    name: 'Negotiate Deal',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'gold',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: [...SETTLEMENT_LOCATIONS],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'gold',
        duration: { min: 1, max: 2 },
        difficulty: SD_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.04 },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The initial terms are the least important part of a negotiation. {name} know{s} this. ' +
          'The counterparty in {location} knows it too, which is why they wait after {name} speaks ' +
          'before responding. Both parties are measuring the distance between where they opened ' +
          'and where they actually intend to land. ' +
          '{?has_faction}Faction backing gives {name} something to point at — a structure, ' +
          'a track record, a name the counterparty already knows.{/has_faction}' +
          '{?no_faction}Independent. The offer has to stand on the quality of the terms alone.{/no_faction}',
        successAfterimage:
          'The counterparty\'s first counter is modest — narrowing rather than reframing. ' +
          'They\'re interested in closing, which means {name} can afford to hold the line a little.',
        failureAfterimage:
          'The opening terms drew a skeptical pause. The counterparty isn\'t hostile, ' +
          'but they\'re not convinced yet either — and {name} has less room to work with than expected.',
      },
      // ActionStepBranch: with prior leverage (strong terms) vs. without (need persuasion)
      {
        branchOnStep: 0,
        variants: {
          strong_opening: {
            reach: 'heart',
            duration: { min: 1, max: 2 },
            difficulty: SD_BASE,
            failBehavior: 'fail_action',
            onSuccess: [],
            onFailure: [],
            successMetadata: {
              reputationDelta: 0.08,
              rewardPool: {
                categoryWeights: { possession: 0.80, condition: 0.15, bestowed_power: 0.05 },
                tagFilters: ['#gold'],
              },
            },
            failureMetadata: {
              reputationDelta: -0.02,
              rewardPool: {
                categoryWeights: { condition: 0.70, possession: 0.30 },
                tagFilters: ['#gold'],
              },
            },
            narrativeTemplate:
              'The second conversation is the one that matters. The counterparty has done ' +
              'their arithmetic and come back with a near-acceptable counter. ' +
              '{name} read{s} the room once more and closes — cleanly, without sweetening it, ' +
              'because adding value at the last moment signals uncertainty, and uncertainty is expensive.',
            successAfterimage:
              'The agreement is reached without ceremony. Both parties stand, and the handshake ' +
              'is brief and dry. That is what a business relationship looks like when it works.',
            failureAfterimage:
              'At the final step, something unravels — a clause that seemed agreed-upon turns out ' +
              'not to have been. The deal dissolves not from hostility but from a gap neither ' +
              'party can close today.',
          },
        },
        fallback: {
          reach: 'heart',
          duration: { min: 2, max: 3 },
          difficulty: SD_BASE + SD_STEP,
          failBehavior: 'fail_action',
          onSuccess: [],
          onFailure: [],
          successMetadata: {
            reputationDelta: 0.06,
            rewardPool: {
              categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
              tagFilters: ['#gold'],
            },
          },
          failureMetadata: {
            reputationDelta: -0.03,
            rewardPool: {
              categoryWeights: { condition: 0.80, possession: 0.20 },
              tagFilters: ['#gold'],
            },
          },
          narrativeTemplate:
            'The closing is where the work is. {name} ha{s} spent the past half-hour building ' +
            'an argument that makes the deal feel inevitable rather than chosen. ' +
            'The counterparty\'s last objection is the important one — not the one they raised first.',
          successAfterimage:
            'The deal closes. The handshake is warmer than the opening suggested it would be. ' +
            '{name} leave{s} with the sense that both parties believe they did well — ' +
            'which is what a good deal feels like.',
          failureAfterimage:
            'The deal collapses on the final clause. The counterparty is not angry — ' +
            'they are simply done. {name} is left holding terms that worked in theory ' +
            'but couldn\'t cross the last gap.',
          criticalSuccessAfterimage:
            'The deal closes on terms better than the opening justified — the counterparty moved more than expected ' +
            'and did so willingly. {name} note{s} the quality of their need: this deal was worth more to them ' +
            'than the terms they accepted reflect.',
          successAtCostAfterimage:
            'The deal closes, but the final clause cost more than the whole negotiation should have. ' +
            '{name} gave ground on a point that will be inconvenient to have given. ' +
            'The agreement is real. The terms favor the counterparty at the margin.',
          criticalFailureAfterimage:
            'The deal collapses, and the counterparty does not attempt to salvage it. ' +
            'What {name} reads in their departure is not disappointment but a decision already made — ' +
            'they had an alternative, and the failed negotiation confirmed they should use it.',
        },
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is opening a negotiation in {location}. The terms are set. Whether the counterparty accepts depends on the next conversation.',
      success:
        'The deal is done. Both parties walk away with what they came for — or close enough.',
      failure:
        'The negotiation broke down at the closing. The deal is not made.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A negotiation in {location}. Whether it closed or failed, the counterparty now has a read on {name}\'s style.',
        changes: [
          {
            id: 'deal_record',
            kind: 'reputation',
            title: 'Deal Record',
            detail: 'Successfully closed deals build commercial trust. Failed deals leave the counterparty skeptical of future proposals.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note about the terms of the deal — or the reasons it fell apart?',
        reactions: [
          {
            id: 'deal_seed_obligation',
            label: 'The deal creates a future obligation on the counterparty\'s side.',
            intent:
              'The agreement is real, but the counterparty accepted more than they might have intended to. ' +
              'They will call in a re-negotiation or ask for a concession down the road.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'social.negotiate_deal',
                delayTicks: 30,
                seedLabel: 'Counterparty seeks to renegotiate terms of prior deal with {name}',
              },
              { kind: 'reputation_tally', key: 'gold.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'deal_seed_grievance',
            label: 'The failed deal left the counterparty feeling the terms were never genuine.',
            intent:
              'The collapse was civil, but the counterparty read {name}\'s closing as bad faith. ' +
              'They\'ll be harder to deal with next time.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'reputation_note',
                severity: 0.25,
                label: 'Counterparty suspects bad faith in failed negotiation — {location}',
                revealFamilies: ['social.investigate_reputation', 'social.negotiate_deal'],
              },
              { kind: 'reputation_tally', key: 'gold.negative', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 6. Persuade ─────────────────────────────────────────────

  {
    id: 'social.persuade',
    name: 'Persuade',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: [...SETTLEMENT_LOCATIONS],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 2 },
        difficulty: SD_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.04 },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'Persuasion starts with the question the target is already asking themselves. ' +
          '{name} look{s} for it in the way they hold their answer in reserve — ' +
          'everyone who hasn\'t decided yet is holding something. The appeal lands when it touches ' +
          'what they\'re actually weighing, not what {name} wants them to weigh. ' +
          '{?has_faction}The faction gives {name} standing in this conversation — ' +
          'the target knows who {they} speak{s} for and what that means.{/has_faction}' +
          '{?no_faction}{name} speaks for {themselves} alone. The case stands on its own logic.{/no_faction}',
        successAfterimage:
          'The target\'s expression settles slightly. They\'re still resistant, but the resistance ' +
          'has shifted from "I won\'t" to "I\'m not sure I should" — which is a different problem.',
        failureAfterimage:
          '{name}\'s appeal found nothing to hold onto. The target\'s uncertainty hasn\'t moved, ' +
          'which means {name} did not locate what they were actually uncertain about.',
      },
      // ActionStepBranch: ally backing present vs alone
      {
        branchOnStep: 0,
        variants: {
          ally_vouches: {
            reach: 'shadow',
            duration: { min: 1, max: 2 },
            difficulty: SD_BASE,
            failBehavior: 'fail_action',
            onSuccess: [],
            onFailure: [],
            successMetadata: {
              reputationDelta: 0.08,
              tierPromotionEligible: true,
              rewardPool: {
                categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
                tagFilters: ['#heart'],
              },
            },
            failureMetadata: {
              reputationDelta: -0.02,
              rewardPool: {
                categoryWeights: { condition: 0.70, possession: 0.30 },
                tagFilters: ['#heart'],
              },
            },
            narrativeTemplate:
              '{name} invokes {ally:strongest} — not as authority, but as shared experience. ' +
              'The argument is: here is someone you trust who has already decided this, ' +
              'and they decided it for these reasons. The target turns this over. ' +
              'Social proof is not logic, but it does not need to be.',
            successAfterimage:
              'The mention of {ally:strongest} did exactly what {name} intended: it moved the question ' +
              'from "is this right?" to "would I be the only one who disagreed?" ' +
              'The target decides not to be the only one.',
            failureAfterimage:
              'The invocation of {ally:strongest} backfired slightly — the target has their own read ' +
              'on that relationship, and it doesn\'t align with how {name} presented it.',
          },
        },
        fallback: {
          reach: 'shadow',
          duration: { min: 2, max: 3 },
          difficulty: SD_BASE + SD_STEP,
          failBehavior: 'fail_action',
          onSuccess: [],
          onFailure: [],
          successMetadata: {
            reputationDelta: 0.06,
            tierPromotionEligible: true,
            rewardPool: {
              categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
              tagFilters: ['#heart'],
            },
          },
          failureMetadata: {
            reputationDelta: -0.03,
            rewardPool: {
              categoryWeights: { condition: 0.80, possession: 0.20 },
              tagFilters: ['#heart'],
            },
          },
          narrativeTemplate:
            '{name} give{s} the final argument not as a closing speech but as a question: ' +
            '"What would it take?" It is the most honest version of persuasion — not ' +
            'telling the target what to think, but finding out what they need to think it. ' +
            'The answer is either something {name} can give or something they cannot.',
          successAfterimage:
            'Conviction lands when it stops being imposed and starts being found. ' +
            '{name} did not change the target\'s mind — {they} helped them locate ' +
            'a decision they were already close to making.',
          failureAfterimage:
            'The target\'s final objection is the real one: not a procedural hesitation ' +
            'but a genuine disagreement that the conversation did not resolve. ' +
            '{name} can see that now. The argument did not reach far enough.',
          criticalSuccessAfterimage:
            'The target not only decides as {name} hoped — they become the argument\'s advocate. ' +
            'The conviction is genuine enough to spread on its own. {name} persuaded one person ' +
            'and will get the work of several.',
          successAtCostAfterimage:
            'The target decides as {name} intended, but the process surfaced a condition — they want something specific ' +
            'in return, unstated but clearly implied. The persuasion succeeded. ' +
            'The obligation it created will follow.',
          criticalFailureAfterimage:
            'The argument did not just fail to reach — it confirmed the target\'s existing doubt about {name}\'s judgment. ' +
            'They leave with a clearer version of their prior position, fortified by the reasons they resisted. ' +
            'The attempt made the work harder, not easier.',
        },
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is attempting to persuade someone in {location}. The outcome depends on whether {they} can find what the target is actually weighing.',
      success:
        'The persuasion held. The target\'s position changed — not from being overridden, but from being reached.',
      failure:
        'The argument ran out before the resistance did.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A persuasion attempt in {location}. The target\'s position has shifted, or the attempt revealed why it couldn\'t.',
        changes: [
          {
            id: 'persuasion_record',
            kind: 'reputation',
            title: 'Persuasion Record',
            detail: 'Success builds authority. Failure tells the target something about how {name} argues that they\'ll remember.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What did the target concede — or what did the failure reveal?',
        reactions: [
          {
            id: 'persuade_seed_action',
            label: 'The target is persuaded — and will act on it.',
            intent:
              'The conviction took hold. The target will do what {name} argued for, ' +
              'and both parties know what that action is.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'social.forge_alliance',
                delayTicks: 12,
                seedLabel: 'Target acts on persuasion — follow-up encounter with {name}',
              },
              { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'persuade_seed_reversal',
            label: 'The target was persuaded — but will regret it and reverse course.',
            intent:
              'The argument worked in the moment but didn\'t create real conviction. ' +
              'The target will reconsider, and when they do, they\'ll be harder to approach.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'social.intimidate',
                delayTicks: 20,
                seedLabel: 'Target reverses prior commitment — confronts {name} over the persuasion',
              },
              { kind: 'reputation_tally', key: 'heart.negative', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 7. Intimidate ────────────────────────────────────────────

  {
    id: 'social.intimidate',
    name: 'Intimidate',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: [...SETTLEMENT_LOCATIONS],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      // ActionStepBranch: alone vs. backed by ally
      {
        branchOnStep: 0,
        variants: {
          ally_present: {
            reach: 'iron',
            duration: { min: 1, max: 1 },
            difficulty: SD_BASE + SD_STEP - 0.05,
            failBehavior: 'continue_weakened',
            onSuccess: [],
            onFailure: [],
            successMetadata: { reputationDelta: 0.06 },
            failureMetadata: { reputationDelta: -0.03 },
            narrativeTemplate:
              '{ally:strongest} is there when {name} step{s} forward, and that presence does work ' +
              'that words would have to work harder to do. ' +
              'The target\'s attention moves between them and calculates — not just threat level, ' +
              'but whether this is coordinated, and what coordination implies. ' +
              '{name} says nothing yet. Sometimes that is the whole message.',
            successAfterimage:
              'The presence of two is worth more than the words of one. ' +
              'The target\'s body language shifts before {name} has said anything specific.',
            failureAfterimage:
              'The ally\'s presence was supposed to help, but the target reads them as backup ' +
              'rather than weight — and backup can be isolated. The dynamic is less favorable than expected.',
          },
        },
        fallback: {
          reach: 'iron',
          duration: { min: 1, max: 1 },
          difficulty: SD_BASE + SD_STEP,
          failBehavior: 'continue_weakened',
          onSuccess: [],
          onFailure: [],
          successMetadata: { reputationDelta: 0.05 },
          failureMetadata: { reputationDelta: -0.04 },
          narrativeTemplate:
            '{name} step{s} into the space between them and does not step back. ' +
            'The gap that opens in the conversation is intentional. ' +
            'Silence in these situations is not absence — it is weight, ' +
            'and {name} has learned to let it accumulate before saying anything. ' +
            '{?has_faction}The faction gives the silence context — the target knows what ' +
            'standing behind {name} they\'re not seeing.{/has_faction}',
          successAfterimage:
            'The target\'s eyes track the exits. They have not said yes yet, ' +
            'but they have stopped saying no.',
          failureAfterimage:
            'The target holds. {name} can see the fear — it\'s there, in the stillness — ' +
            'but the fear and the compliance are not the same thing, and the target knows that.',
        },
      },
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: SD_BASE + SD_STEP * 2,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.06 },
        failureMetadata: { reputationDelta: -0.05 },
        narrativeTemplate:
          '{name} name{s} what is being asked for — plainly, without euphemism. ' +
          'This is the moment that separates intimidation from a threat: ' +
          'a threat leaves room for bargaining, a direct demand does not. ' +
          '{name} is not bargaining. The target needs to understand that ' +
          'before they decide what to do with it.',
        successAfterimage:
          'The target agrees. Their voice is level but their hands are not quite still. ' +
          '{name} does not remark on this. The agreement is what matters. ' +
          'The fear can be its own private business.',
        failureAfterimage:
          'The target finds somewhere in themselves what they came in thinking they didn\'t have. ' +
          'Not bravery exactly — more like a calculus that decided the cost of yielding ' +
          'was higher than the cost of refusing. {name} did not account for that arithmetic.',
        criticalSuccessAfterimage:
          'The target does not just agree — they volunteer more than {name} asked for, in the way that people do ' +
          'when they have decided that the safest path is to become useful. ' +
          '{name} now has more leverage than the encounter was designed to produce.',
        successAtCostAfterimage:
          'The target agrees, but the compliance comes with defiance underneath it — ' +
          'provisional, conditional, already looking for the clause that voids it. ' +
          '{name} got what {they} asked for. Holding it will require more work.',
        criticalFailureAfterimage:
          'The target refuses and does not leave quietly. Whatever they found in themselves ' +
          'in the moment of refusal has named {name} an enemy in terms they were not previously using. ' +
          'The intimidation attempt created a relationship it did not intend to create.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is applying direct pressure to a target in {location}. ' +
        'The method is physical presence first, explicit demand second.',
      success:
        'The target yields. Fear and compliance landed in the same place.',
      failure:
        'The target refused. Something in their calculation shifted at the last moment.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'An intimidation in {location}. The target either yielded or didn\'t — ' +
          'either way, they now have a mark that affects how they relate to {name}.',
        changes: [
          {
            id: 'intimidation_record',
            kind: 'reputation',
            title: 'Intimidation Record',
            detail: 'Successful intimidation builds shadow reputation and plants a fear-debt. Failed intimidation exposes vulnerability.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the target carry from this encounter — compliance or resistance?',
        reactions: [
          {
            id: 'intimidate_mark_fear',
            label: 'The target complied — and is now waiting for a moment to reverse it safely.',
            intent:
              'Coerced compliance is temporary. The target accepted the terms but is already looking ' +
              'for a way to reduce {name}\'s leverage.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'debt',
                severity: 0.4,
                label: 'Target cowed by {name} — will seek reversal when leverage shifts',
                revealFamilies: ['social.spy_on', 'social.political_leverage', 'social.challenge_duel'],
              },
              {
                kind: 'encounter_seed',
                templateId: 'social.challenge_duel',
                delayTicks: 36,
                seedLabel: 'Cowed target seeks confrontation with {name} once balance shifts',
              },
              { kind: 'reputation_tally', key: 'iron.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'intimidate_mark_defiance',
            label: 'The target refused — and now knows {name} attempted it.',
            intent:
              'Failed intimidation does not end the relationship. It reshapes it. ' +
              'The target knows what {name} is willing to do, which is information they will use.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'betrayal',
                severity: 0.35,
                label: 'Attempted intimidation — target witnessed {name}\'s coercive method',
                revealFamilies: ['social.investigate_reputation', 'social.political_leverage'],
              },
              { kind: 'reputation_tally', key: 'iron.negative', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 8. Deceive ───────────────────────────────────────────────

  {
    id: 'social.deceive',
    name: 'Deceive',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: [...SETTLEMENT_LOCATIONS],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'shadow',
        duration: { min: 2, max: 2 },
        difficulty: SD_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.03 },
        failureMetadata: { reputationDelta: -0.04 },
        narrativeTemplate:
          'The false narrative has to be mostly true — that is the first principle. ' +
          '{name} build{s} the lie around a scaffolding of fact, because the target ' +
          'will look for inconsistencies and the inconsistencies have to be ' +
          'the ones {name} is prepared to explain. ' +
          '{?has_faction}Faction context gives the cover story texture: a reason for the visit, ' +
          'a chain of accountability that checks out.{/has_faction}' +
          '{?no_faction}No faction backing means the cover story has to be self-contained — ' +
          'each question the target asks has to lead to another question rather than a wall.{/no_faction}',
        successAfterimage:
          'The false narrative sits correctly. {name} can feel when a story takes — ' +
          'the target stopped auditing and started accepting, ' +
          'which is a different quality of attention.',
        failureAfterimage:
          'Something didn\'t land right. The target is still listening, ' +
          'but their listening has changed register — less reception, more evaluation. ' +
          '{name} adjusts the approach and hopes the adjustment isn\'t visible.',
      },
      {
        reach: 'heart',
        duration: { min: 2, max: 2 },
        difficulty: SD_BASE + SD_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.05,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#shadow'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#shadow'],
          },
        },
        narrativeTemplate:
          '{name} carry{s} the deception to its conclusion the way you carry a full cup — ' +
          'continuously aware, adjusting constantly to the surface. ' +
          'The target asks one final question. It is either the question {name} prepared for, ' +
          'or it is the question that finds the gap in everything {they} built.',
        successAfterimage:
          'The target acts on false belief. {name} watch{s} them go and keeps {their} expression ' +
          'neutral until they are out of sight. The lie has been consumed. ' +
          'What it produces now is no longer in {name}\'s hands.',
        failureAfterimage:
          'The target pauses mid-sentence and asks the question in a different way — ' +
          'the way you ask a question when you already know the answer you\'re going to get ' +
          'doesn\'t match what you\'ve been told. The gap has been found.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is constructing a false narrative for a target in {location}. ' +
        'The lie is built around a skeleton of fact.',
      success:
        'The deception held. The target acted on a false picture.',
      failure:
        'The deception collapsed. The target located the gap.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A deception attempt in {location}. Whether the lie held or was found out, ' +
          'something real was transacted between these two people.',
        changes: [
          {
            id: 'deception_record',
            kind: 'reputation',
            title: 'Deception Record',
            detail: 'Successful deception goes unrecorded — for now. Failed deception marks {name} as someone who cannot be trusted.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god mark about the deception — its success, or its exposure?',
        reactions: [
          {
            id: 'deceive_mark_hidden',
            label: 'The deception succeeded — and will eventually surface.',
            intent:
              'All successful deceptions carry a hidden cost: the lie exists, ' +
              'and the gap between what the target was told and what is true grows wider with time.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.5,
                label: 'Conducted successful deception against target in {location}',
                revealFamilies: ['social.investigate_reputation', 'social.spy_on', 'social.political_leverage'],
              },
              {
                kind: 'encounter_seed',
                templateId: 'social.investigate_reputation',
                delayTicks: 40,
                seedLabel: 'Target begins to suspect something is wrong — investigates {name}\'s story',
              },
              { kind: 'reputation_tally', key: 'shadow.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'deceive_mark_exposed',
            label: 'The deception was exposed — the target knows {name} lied.',
            intent:
              'Being caught in a lie is not just a failed transaction. It is a mark ' +
              'that {name} attempted it, which tells the target something about who they are.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'betrayal',
                severity: 0.6,
                label: 'Caught in deception — target witnessed {name} construct a false narrative',
                revealFamilies: ['social.investigate_reputation', 'social.political_leverage', 'social.intimidate'],
              },
              { kind: 'reputation_tally', key: 'shadow.negative', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 9. Challenge to Duel ─────────────────────────────────────

  {
    id: 'social.challenge_duel',
    name: 'Challenge to Duel',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: [...SETTLEMENT_LOCATIONS],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: SD_BASE + SD_STEP,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.05 },
        failureMetadata: { reputationDelta: -0.04 },
        narrativeTemplate:
          'The challenge is a formal instrument in {location}, and {name} use{s} it as one. ' +
          'The words are old and specific — the kind of phrasing that closes off the possibility ' +
          'of "I misunderstood." Witnesses matter here, and {name} chose the location ' +
          'with witnesses in mind. ' +
          '{?has_rival}This is about {rival:strongest}. The public record of it matters as much as the outcome.{/has_rival}',
        successAfterimage:
          'The challenge is accepted. The opponent\'s voice is level and {name} respects that — ' +
          'you can read a great deal from how someone accepts a fight they know they might lose.',
        failureAfterimage:
          'The challenge is refused. The refusal is not necessarily cowardice — ' +
          'there are ways to decline a duel that cost the challenger more than the challenged. ' +
          '{name} is not certain which is happening.',
      },
      {
        reach: 'gold',
        duration: { min: 1, max: 1 },
        difficulty: SD_BASE + SD_STEP * 2,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        failureMetadata: { reputationDelta: -0.06 },
        narrativeTemplate:
          'Steel is out. The geometry of this is simple: two people, a defined space, ' +
          'a problem that has been translated from words into bodies. ' +
          '{name}\'s first move is not the one the opponent expects, ' +
          'which is why {they} thought about it carefully before arriving.',
        successAfterimage:
          '{name} finds the opening. The touch is clean — the kind that ends a duel ' +
          'without requiring an explanation. Both parties know what just happened.',
        failureAfterimage:
          'The opponent found the opening first. {name}\'s defense held it to a graze, ' +
          'but held does not mean resolved — the advantage has shifted.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: SD_BASE + SD_STEP * 3,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.10,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
            tagFilters: ['#combat'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.05,
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
            tagFilters: ['#combat'],
          },
        },
        narrativeTemplate:
          'The last exchange is the one that decides it. In a duel, most of the fight ' +
          'has already happened by the time the ending arrives — ' +
          'what remains is the question of whether endurance or skill is the variable that matters. ' +
          '{name} breathe{s} once and commit{s}.',
        successAfterimage:
          'The duel is over. The witnesses know who won, and why, ' +
          'and the reasoning will be discussed in {location} for some time. ' +
          '{name} clean{s} the blade without looking at the opponent.',
        failureAfterimage:
          'The defeat is real and public. {name} has a better understanding of their own limits ' +
          'than they did an hour ago, which is worth something — but the cost of that knowledge was high.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} has issued a formal challenge in {location}. Three steps between here and the outcome.',
      success:
        'The duel is settled. The victory is public and the record is clear.',
      failure:
        'The duel is settled. The loss is public and the record is also clear.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A formal duel in {location}. Whoever won, the event is now part of the public record in this settlement.',
        changes: [
          {
            id: 'duel_record',
            kind: 'reputation',
            title: 'Duel Record',
            detail: 'Victory raises honor and iron reputation. Defeat plants a mark that rivals can invoke in future encounters.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note about how the duel ended — and what it changed?',
        reactions: [
          {
            id: 'duel_honor_vindicated',
            label: 'Victory — {name}\'s honor is publicly restored.',
            intent:
              'The win was witnessed and recorded. {name}\'s position in {location} ' +
              'has been upgraded by the public nature of the resolution.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'social.forge_alliance',
                delayTicks: 15,
                seedLabel: 'Witnessed duelist seeks {name} after public victory — respect opens doors',
              },
              { kind: 'reputation_tally', key: 'iron.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'duel_mark_bested',
            label: 'Defeat — the loss is public and the loser remembers it.',
            intent:
              'Losing a duel is not just a physical fact. It is a public fact, ' +
              'and the loser carries it until they have a chance to reverse it.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'betrayal',
                severity: 0.5,
                label: 'Publicly bested in duel — witnessed defeat in {location}',
                revealFamilies: ['social.challenge_duel', 'social.intimidate', 'social.political_leverage'],
              },
              {
                kind: 'encounter_seed',
                templateId: 'social.challenge_duel',
                delayTicks: 48,
                seedLabel: 'Defeated duelist seeks rematch when their position has recovered',
              },
              { kind: 'reputation_tally', key: 'iron.negative', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 10. Sabotage ─────────────────────────────────────────────

  {
    id: 'social.sabotage',
    name: 'Sabotage',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: [...SETTLEMENT_LOCATIONS],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'shadow',
        duration: { min: 2, max: 2 },
        difficulty: SD_BASE + SD_STEP,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.03 },
        failureMetadata: { reputationDelta: -0.05 },
        narrativeTemplate:
          'The target has defenses because they have enemies, which is good information. ' +
          '{name} catalogues what is watched, what is logged, what is left to habit rather than attention. ' +
          'Habits are the entry point. In {location}, every operation has a habit somewhere — ' +
          'a handoff point, a shift change, a mechanism that was secured once and assumed ever after. ' +
          '{?has_faction}Guild knowledge covers the standard gaps.{/has_faction}',
        successAfterimage:
          '{name} move{s} through the target\'s perimeter using the gap that habit created. ' +
          'No one saw anything because no one was looking at the right place at the right time — ' +
          'which is what patient reconnaissance is for.',
        failureAfterimage:
          'The perimeter is tighter than the mapping suggested. Something has changed — ' +
          'either the target was warned, or their own paranoia did the work. ' +
          '{name} pull{s} back to assess.',
      },
      {
        reach: 'gold',
        duration: { min: 2, max: 2 },
        difficulty: SD_BASE + SD_STEP * 2,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.06 },
        failureMetadata: { reputationDelta: -0.04 },
        narrativeTemplate:
          'The critical mechanism is in front of {name}. The act of sabotage is not dramatic — ' +
          'it is precise. A specific component, a specific failure mode, a damage that will look ' +
          'like age or accident rather than intent. {They} work{s} with a craftsperson\'s patience, ' +
          'making the kind of small, considered alterations that a hurried actor would miss.',
        successAfterimage:
          'Done. The damage is invisible until it isn\'t. The operation will continue normally ' +
          'until the compromised element does what compromised elements do — ' +
          'at which point {name} will be long gone.',
        failureAfterimage:
          'The mechanism resisted or the time ran out. Whatever {name} managed to do ' +
          'is not enough to achieve the intended failure. The operation is intact for now.',
      },
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: SD_BASE + SD_STEP * 3,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.08,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
            tagFilters: ['#shadow'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
            tagFilters: ['#shadow'],
          },
        },
        narrativeTemplate:
          'The exit is the part most saboteurs do wrong — they treat the escape as secondary ' +
          'to the act, and that is why they get caught. ' +
          '{name} mapped the exit before {they} mapped the entry, and {they} take{s} it ' +
          'exactly as planned, without pausing to verify the work. ' +
          'Verifying the work means looking back, and looking back is what draws attention.',
        successAfterimage:
          '{name} is three streets from the target when the alarm sounds. ' +
          'They are already someone else — different pace, different direction. ' +
          'No one is looking for the right person in the right place.',
        failureAfterimage:
          'A voice behind {name}. Too precise to be coincidence. ' +
          'The target had a contingency and it was activated. ' +
          '{name} will have to account for their presence in {location} and explain it well.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is conducting a sabotage operation in {location}. Three phases: infiltration, tampering, extraction.',
      success:
        'Clean exit. The damage will surface later. {name}\'s involvement is not on the record.',
      failure:
        'The operation was compromised at the extraction. {name}\'s presence is known.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A sabotage operation in {location}. Clean exit or caught in the act — the outcome shapes what comes next.',
        changes: [
          {
            id: 'sabotage_record',
            kind: 'reputation',
            title: 'Sabotage Record',
            detail: 'Clean sabotage is invisible until the damage surfaces. Caught sabotage leaves a serious mark.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note about the sabotage and its likely consequences?',
        reactions: [
          {
            id: 'sabotage_seed_damage',
            label: 'The sabotage will surface in the next operation cycle.',
            intent:
              'The damage is real but hidden. When it becomes apparent, it will cause a crisis ' +
              'for the target\'s operations — and the investigation will look backward.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'social.investigate_reputation',
                delayTicks: 30,
                seedLabel: 'Sabotage damage surfaces — target investigates, {name} is a possible suspect',
              },
              { kind: 'reputation_tally', key: 'shadow.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'sabotage_mark_implicated',
            label: 'The operation was compromised — {name} was seen.',
            intent:
              'Being placed at the scene is not the same as being convicted, ' +
              'but it is enough to make future operations against this target much harder.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.65,
                label: 'Implicated in sabotage operation — seen near target in {location}',
                revealFamilies: ['social.investigate_reputation', 'social.political_leverage', 'social.challenge_duel'],
              },
              { kind: 'reputation_tally', key: 'shadow.negative', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 11. Rob ──────────────────────────────────────────────────

  {
    id: 'social.rob',
    name: 'Rob',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: [...SETTLEMENT_LOCATIONS],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: SD_BASE + SD_STEP,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.04 },
        failureMetadata: { reputationDelta: -0.05 },
        narrativeTemplate:
          '{name} choose{s} the location and the moment and steps out. ' +
          'Not theatrically — that is the amateur version. The mark needs to understand ' +
          'what is happening before they need to decide what to do about it. ' +
          '{?has_rival}The mark has history with {rival:strongest}, ' +
          'which tells {name} something about how they are likely to respond under pressure.{/has_rival}' +
          '{?has_faction}Faction backing means there is a known consequence for the mark ' +
          'if they make noise about this — which is itself a kind of leverage.{/has_faction}',
        successAfterimage:
          'The mark freezes. The moment of decision — fight, flight, comply — ' +
          'resolves in the direction {name} needed. The gap opens.',
        failureAfterimage:
          'The mark does not freeze. They react, loudly, in a direction {name} did not model. ' +
          'The confrontation has become something else.',
      },
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: SD_BASE + SD_STEP * 2,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.05,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#combat'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
        narrativeTemplate:
          'The take is fast, which is the only way to do it. {name} work{s} without looking ' +
          'at the mark\'s face — the face is the thing that slows you down, because faces are ' +
          'stories and stories are weight. The transaction is done before either party has time ' +
          'to process what it means.',
        successAfterimage:
          '{name} is twenty paces away and moving normally before the mark finds their voice. ' +
          'The prize is heavy enough to matter. The face, {they} will not remember.',
        failureAfterimage:
          'A guard who was not in the original read steps into the lane at exactly the wrong moment. ' +
          '{name} is three choices from a bad outcome and needs to make them quickly.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is targeting a mark in {location}. The job is confrontation, extraction, and clean exit.',
      success:
        'The robbery was quick and precise. {name} is gone before the mark has fully processed it.',
      failure:
        'Something in the location or the mark\'s response went outside the plan.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A robbery in {location}. Either {name} made a clean exit or complications emerged.',
        changes: [
          {
            id: 'robbery_record',
            kind: 'reputation',
            title: 'Robbery Record',
            detail: 'A clean robbery is anonymous. An identified robbery creates a mark that compounds.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note about the robbery and who witnessed it?',
        reactions: [
          {
            id: 'rob_mark_witness',
            label: 'The mark can identify {name} — the robbery was not anonymous.',
            intent:
              'The mark saw {name}\'s face well enough. ' +
              'The robbery succeeded but the anonymity did not.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.45,
                label: 'Mark can identify {name} — robbery was witnessed directly',
                revealFamilies: ['social.investigate_reputation', 'social.challenge_duel', 'social.political_leverage'],
              },
              { kind: 'reputation_tally', key: 'iron.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'rob_clean_exit',
            label: 'The robbery was clean — {name} was not identified.',
            intent:
              'The mark was too alarmed to form a clear account. ' +
              '{name} is a description, not a name.',
            effects: [
              { kind: 'reputation_tally', key: 'shadow.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 12. Establish Patronage ──────────────────────────────────

  {
    id: 'social.establish_patronage',
    name: 'Establish Patronage',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'gold',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: [...SETTLEMENT_LOCATIONS],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        reach: 'gold',
        duration: { min: 2, max: 2 },
        difficulty: SD_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.05 },
        failureMetadata: { reputationDelta: -0.03 },
        narrativeTemplate:
          'The offer of patronage is made quietly, as these things always should be. ' +
          '{name} does not open with numbers — {they} open{s} with a question: ' +
          'what does the recipient actually need? The answer is always more specific ' +
          'than "money" or "protection," and the specificity is where a real arrangement lives. ' +
          '{?has_ally}The approach through {ally:strongest} gave this conversation a context — ' +
          'the recipient already knows this is a serious offer from a serious person.{/has_ally}',
        successAfterimage:
          'The recipient is listening in the way people listen when they are ' +
          'deciding whether to say yes — actively, with the calculation running.',
        failureAfterimage:
          'The offer landed as what it looked like rather than what it was. ' +
          'The recipient is polite but closed. Something in the approach read as transactional ' +
          'where it needed to read as investment.',
      },
      {
        reach: 'heart',
        duration: { min: 2, max: 2 },
        difficulty: SD_BASE + SD_STEP,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.06 },
        failureMetadata: { reputationDelta: -0.03 },
        narrativeTemplate:
          'The terms of patronage are not a contract. They are an understanding — ' +
          'what is expected, what is provided, what the limits of each are. ' +
          '{name} is careful to make the terms generous enough to be worth accepting ' +
          'and specific enough to be worth honoring. ' +
          'The risk in patronage is that the recipient accepts without meaning to deliver. ' +
          '{name} watch{s} for that.',
        successAfterimage:
          'The understanding is reached. Power moving downward, loyalty moving upward — ' +
          'the old compact, understood between two people who know what they are entering.',
        failureAfterimage:
          'The terms cannot be agreed. The power difference is either too large to be ' +
          'comfortable or too small to be useful. {name} has misjudged the recipient\'s ' +
          'sense of what they are worth.',
      },
      {
        reach: 'gold',
        duration: { min: 2, max: 2 },
        difficulty: SD_BASE + SD_STEP * 2,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        failureMetadata: { reputationDelta: -0.05 },
        narrativeTemplate:
          'The first concrete act of patronage is the one that determines whether the arrangement ' +
          'is real or ceremonial. {name} deliver{s} on the first promise without waiting to be asked — ' +
          'a patron who waits to be asked is a patron who has already broken the compact. ' +
          'What was promised arrives at the right scale and at the right time.',
        successAfterimage:
          'The recipient\'s expression changes when the delivery lands — not surprise, ' +
          'but something adjusting into place. The arrangement is no longer theoretical.',
        failureAfterimage:
          'The delivery is late, or partial, or missing the thing that mattered most. ' +
          'The recipient is understanding, which is worse than anger — it means they expected it.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is establishing a patronage arrangement in {location}. Three stages: offer, terms, first investment.',
      success:
        'Patronage is established. The network is real.',
      failure:
        'The arrangement did not hold past the first investment.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A patronage arrangement in {location}. What was offered, agreed to, and delivered — or failed to be.',
        changes: [
          {
            id: 'patronage_record',
            kind: 'reputation',
            title: 'Patronage Record',
            detail: 'Successful patronage creates a network of loyalty and obligation. Failed investment marks {name} as unreliable.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note about the patronage arrangement and the obligations it created?',
        reactions: [
          {
            id: 'patronage_seed_obligation',
            label: 'The recipient owes {name} — and will be called upon.',
            intent:
              'Patronage creates debt. The patron who invests is entitled to expect ' +
              'something in return — and the timing of that expectation is {name}\'s to choose.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'debt',
                severity: 0.3,
                label: 'Client owes {name} patron-debt — established in {location}',
                revealFamilies: ['social.political_leverage', 'social.persuade'],
              },
              {
                kind: 'encounter_seed',
                templateId: 'social.persuade',
                delayTicks: 24,
                seedLabel: 'Patron {name} calls on client to repay their debt with an action',
              },
              { kind: 'reputation_tally', key: 'gold.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'patronage_seed_gratitude',
            label: 'The client is genuinely grateful and will act on it without being asked.',
            intent:
              'Some patronage creates real loyalty, not just formal obligation. ' +
              'The client will look for ways to demonstrate their value without prompting.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'social.forge_alliance',
                delayTicks: 18,
                seedLabel: 'Grateful client introduces {name} to their own network — alliance opportunity',
              },
              { kind: 'reputation_tally', key: 'gold.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 13. Political Leverage ───────────────────────────────────

  {
    id: 'social.political_leverage',
    name: 'Political Leverage',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: [...SETTLEMENT_LOCATIONS],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        reach: 'shadow',
        duration: { min: 2, max: 2 },
        difficulty: SD_BASE + SD_STEP,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.04 },
        failureMetadata: { reputationDelta: -0.03 },
        narrativeTemplate:
          'Political leverage is never about the leverage itself. It is about the target\'s ' +
          'certainty that you have it. {name} spend{s} time in {location} assembling that certainty — ' +
          'not from threats, but from demonstrated knowledge: ' +
          'a name the target didn\'t expect {name} to know, a date that shouldn\'t be accessible, ' +
          'a favor whose existence was supposed to be private. ' +
          '{?has_faction}Faction intelligence is the mechanism. {name} use{s} what others collected.{/has_faction}' +
          '{?no_faction}{name} assembled this from observation and prior encounters. ' +
          'Nothing borrowed — everything earned.{/no_faction}',
        successAfterimage:
          '{name} watch{s} the moment when the target understands the scope of what {they} know{s}. ' +
          'It is a small shift in the face — a recalculation happening behind the eyes.',
        failureAfterimage:
          'The target\'s guards are too well-placed. The intelligence {name} has is suggestive ' +
          'but not conclusive, and the target can see the difference.',
      },
      // ActionStepBranch: faction-backed approach vs. independent
      {
        branchOnStep: 0,
        variants: {
          faction_backed: {
            reach: 'heart',
            duration: { min: 2, max: 2 },
            difficulty: SD_BASE + SD_STEP * 2 - 0.05,
            failBehavior: 'continue_weakened',
            onSuccess: [],
            onFailure: [],
            successMetadata: {
              reputationDelta: 0.08,
              tierPromotionEligible: true,
            },
            failureMetadata: { reputationDelta: -0.04 },
            narrativeTemplate:
              'The pressure is applied through an intermediary — {ally:strongest} as a voice ' +
              'that the target respects and has reason to listen to. {name} is not in the room. ' +
              '{name}\'s name is not spoken. The pressure arrives as a shift in the landscape ' +
              'the target inhabits rather than as a direct confrontation.',
            successAfterimage:
              'The landscape shifted. The target made a decision that {name} needed them to make, ' +
              'without knowing {name} was the reason.',
            failureAfterimage:
              'The intermediary\'s influence was less than expected. The target moved, ' +
              'but not in the direction the pressure was designed to produce.',
          },
        },
        fallback: {
          reach: 'heart',
          duration: { min: 2, max: 3 },
          difficulty: SD_BASE + SD_STEP * 2,
          failBehavior: 'continue_weakened',
          onSuccess: [],
          onFailure: [],
          successMetadata: {
            reputationDelta: 0.07,
            tierPromotionEligible: true,
          },
          failureMetadata: { reputationDelta: -0.05 },
          narrativeTemplate:
            'The pressure is applied directly. {name} tells the target what {name} knows, ' +
            'in specific enough terms that denial is not available. ' +
            'Then {name} names what {they} want{s}. No elaboration. No threat. ' +
            'The information and the request are the whole argument. ' +
            '{?has_rival}The target knows what {rival:strongest} would do with this information. ' +
            'That is the thing {name} doesn\'t have to say.{/has_rival}',
          successAfterimage:
            'The target agrees. Their voice is measured and their decision is made ' +
            'with the particular calm of someone who has weighed their options and found ' +
            'this one least costly.',
          failureAfterimage:
            'The target calls the position — not because they can disprove it, ' +
            'but because they have decided to absorb the cost of exposure rather than comply. ' +
            '{name} did not model that choice correctly.',
        },
      },
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: SD_BASE + SD_STEP * 3,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.09 },
        failureMetadata: { reputationDelta: -0.06 },
        narrativeTemplate:
          'The new arrangement must be made durable. A single application of leverage ' +
          'produces a single action, not a sustained change. {name} work{s} quickly, ' +
          'while the target is still in the state of compliance, to establish the new equilibrium — ' +
          'the pattern of behavior that looks voluntary to observers ' +
          'and costs {name} nothing to maintain.',
        successAfterimage:
          'The arrangement is in place. The target will operate within it ' +
          'not because they have no choice, but because the cost of stepping outside it ' +
          'now appears higher than the cost of compliance.',
        failureAfterimage:
          'The consolidation fails. The target\'s compliance was transient, ' +
          'and they have found their footing again. Whatever advantage {name} had ' +
          'has been reduced, though not eliminated.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is applying political leverage in {location}. The target has something to protect, and {name} knows what it is.',
      success:
        'The leverage produced a durable change. The new arrangement holds.',
      failure:
        'The leverage was applied but failed to stick past the first compliance.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A political leverage operation in {location}. {name} moved against a target using information as a tool.',
        changes: [
          {
            id: 'leverage_record',
            kind: 'reputation',
            title: 'Leverage Record',
            detail: 'Successful leverage reshapes the political landscape. Failed leverage exposes the attempt.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god mark about how the leverage was used — and what it cost?',
        reactions: [
          {
            id: 'leverage_intel_network',
            label: 'The operation revealed the target\'s full network of obligations.',
            intent:
              'The process of gathering and applying leverage mapped the target\'s relationships. ' +
              'The resulting intelligence is more valuable than the compliance it produced.',
            effects: [
              {
                kind: 'intelligence',
                category: 'agent_network',
                label: 'Political leverage operation: full obligation network of target in {location} mapped',
                detail:
                  'The investigation and pressure process revealed who the target owes, who owes them, ' +
                  'and which of their relationships are genuine versus transactional. ' +
                  'This network map is directly useful for future political maneuvering.',
                reliability: 0.8,
              },
              { kind: 'reputation_tally', key: 'shadow.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'leverage_seed_retaliation',
            label: 'The target complied — and is now building a counter.',
            intent:
              'Political leverage creates retaliation incentives. ' +
              'The target has accepted the terms for now, but they are already identifying ' +
              'how to reverse the position.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'betrayal',
                severity: 0.55,
                label: 'Target leveraged by {name} — building counter-leverage',
                revealFamilies: ['social.spy_on', 'social.investigate_reputation'],
              },
              {
                kind: 'encounter_seed',
                templateId: 'social.political_leverage',
                delayTicks: 48,
                seedLabel: 'Target deploys counter-leverage against {name} once position is recovered',
              },
              { kind: 'reputation_tally', key: 'shadow.negative', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 14. Found a Group ────────────────────────────────────────

  {
    id: 'social.found_group',
    name: 'Found a Group',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'heart',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: [...SETTLEMENT_LOCATIONS],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        reach: 'heart',
        duration: { min: 3, max: 3 },
        difficulty: SD_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.05 },
        failureMetadata: { reputationDelta: -0.03 },
        narrativeTemplate:
          'The vision has to survive contact with people who have no reason to believe in it yet. ' +
          '{name} speak{s} in {location} to whoever will listen, which is not many — ' +
          'but the ones who stay after the first three minutes are the ones worth speaking to. ' +
          'The hardest part of founding something is giving the idea to people who will ' +
          'change it into something {name} didn\'t imagine. That is the point of other people. ' +
          '{?has_faction}Existing faction standing lends the vision authority before a word is spoken.{/has_faction}' +
          '{?no_faction}The vision stands on its own logic. No institutional backing. Just the argument.{/no_faction}',
        successAfterimage:
          'The audience contracts and then solidifies. A few people are still here ' +
          'at the end who were not here at the beginning. {name} note{s} which ones asked questions ' +
          'versus which ones nodded — the question-askers are the ones who will show up again.',
        failureAfterimage:
          'The vision did not land. The audience dispersed with the polite non-commitments ' +
          'that signal "I am not against this, I just don\'t care enough to be for it." ' +
          '{name} is left with a clearer picture of what the vision was missing.',
      },
      {
        reach: 'shadow',
        duration: { min: 2, max: 2 },
        difficulty: SD_BASE + SD_STEP,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.06,
          tierPromotionEligible: true,
        },
        failureMetadata: { reputationDelta: -0.03 },
        narrativeTemplate:
          'The founding membership is assembled not by announcement but by finding. ' +
          '{name} moves through {location} and identifies the people who already live ' +
          'close to the thing {they} is{s} trying to build — the ones who have been ' +
          'solving related problems independently, who are frustrated by the same things, ' +
          'who have the skills and the disposition to commit rather than contribute. ' +
          '{?has_ally}The prior connection to {ally:strongest} opens doors that would otherwise take weeks.{/has_ally}',
        successAfterimage:
          'A core of founding members. Not many — five, perhaps eight — ' +
          'but enough to begin, and the right enough that the group\'s first conversations ' +
          'will be substantive rather than procedural.',
        failureAfterimage:
          'Few stepped forward. The movement has interest but not depth — ' +
          'people are willing to observe but not to commit. ' +
          '{name} needs to understand why before attempting the next round.',
      },
      {
        reach: 'heart',
        duration: { min: 2, max: 2 },
        difficulty: SD_BASE + SD_STEP * 2,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.10,
        },
        failureMetadata: { reputationDelta: -0.05 },
        narrativeTemplate:
          'The charter is the document where the vision becomes a structure, ' +
          'and structure is where founding members find out whether they actually agree. ' +
          '{name} navigate{s} the first conflict carefully — ' +
          'most groups die in their charter meetings, killed by people who agree on the goal ' +
          'but cannot agree on the means. ' +
          'The question {name} is really answering is: whose version of this thing are we building?',
        successAfterimage:
          'The charter is ratified. Not unanimously — two dissents, noted and addressed — ' +
          'but ratified. The group exists. It has a name, a purpose, and a set of agreements ' +
          'that the founding members believe they can honor.',
        failureAfterimage:
          'The charter meeting fractures. A fundamental disagreement about purpose — ' +
          'not strategy, not details, but the core question — proves irreconcilable. ' +
          'The group dissolves back into its constituent individuals, ' +
          'each of whom now has a clearer picture of why the vision was hard.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is attempting to found a group in {location}. Vision, membership, and charter — in that order.',
      success:
        'The group is founded. It exists as a real thing with real people committed to it.',
      failure:
        'The founding collapsed at the charter. The group did not cohere.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A founding attempt in {location}. Whether the group coalesced or fractured, ' +
          'the people involved now have a shared reference point with {name}.',
        changes: [
          {
            id: 'founding_record',
            kind: 'reputation',
            title: 'Founding Record',
            detail: 'Successfully founding a group establishes {name} as someone who builds. A fractured founding is also known.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note about the new group — or the fracture?',
        reactions: [
          {
            id: 'found_group_seed_growth',
            label: 'The group is real — and will grow beyond what {name} intended.',
            intent:
              'Founding something is giving it to other people. ' +
              'The group will develop needs, conflicts, and directions that {name} did not plan for.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'social.recruit_faction',
                delayTicks: 24,
                seedLabel: 'Founded group reaches critical mass — {name} is called to guide next expansion',
              },
              { kind: 'reputation_tally', key: 'heart.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'found_group_seed_fracture',
            label: 'The founding failed — the core members scattered with grievances.',
            intent:
              'The people who showed up and then were disappointed are a specific kind of problem. ' +
              'They believed, and then they didn\'t, and they know why.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'social.political_leverage',
                delayTicks: 30,
                seedLabel: 'Former founder-member uses the fracture against {name} politically',
              },
              { kind: 'reputation_tally', key: 'heart.negative', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];

// ─── Lookup Functions ───────────────────────────────────────

import { SOCIAL_SCENE_TEMPLATES } from './social-scene-templates';
import type { UnifiedActionTemplate } from '../types/unifiedAction';

export const ALL_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [
  ...SOCIAL_SCENE_TEMPLATES,
];

/**
 * Return social scene encounters available at a given location type.
 */
export function getSocialEncountersByLocationType(locationType: string): UnifiedActionTemplate[] {
  return SOCIAL_SCENE_TEMPLATES.filter(encounter =>
    encounter.locationSubtypes?.includes(locationType),
  );
}

/**
 * Get a social scene encounter template by ID.
 */
export function getSocialEncounterById(id: string): UnifiedActionTemplate | undefined {
  return SOCIAL_SCENE_TEMPLATES.find(t => t.id === id);
}
