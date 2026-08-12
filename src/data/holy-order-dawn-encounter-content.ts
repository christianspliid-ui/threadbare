/**
 * Holy Order of the Dawn Encounter Content — migrated to UnifiedActionTemplate (THR-31).
 *
 * Quest, social, join, and promotion templates for the Holy Order of the Dawn.
 * All 15 legacy EncounterTemplate entries rewritten to UnifiedActionTemplate format
 * with Threadbare-aesthetic prose, enrichment placeholders, conditional blocks,
 * and systemic aftermath (hidden marks, encounter seeds, reputation tallies).
 *
 * Voice: Formal cadence, slight archaism. The faithful do not admit doubt — the prose
 * shows doubt in the weather, not the words. Long assured sentences, short ones for cost.
 * Lexicon: Dawn, vigil, faithful, light, shadow, oath, blade, rite, cleansing, witness.
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';
import { withEncounterContract } from './encounter-contract-builder';
import {
  FACTION_PROSE_SEED_DELAY_QUEST_TICKS,
  FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
  FACTION_PROSE_HIDDEN_MARK_BETRAYAL_SEVERITY,
} from './faction-constants';

// ─── Constants ───────────────────────────────────────────────────────────

const HOD_DIFFICULTY_BASE = 25;
const HOD_DIFFICULTY_STEP = 10;
const HOD_SENIOR_BASE = 40;
const HOD_ELITE_BASE = 55;
const HOD_JOIN_DIFFICULTY = 20;
const HOD_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const HOLY_ORDER_DAWN_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  // Join & Promotion
  ['hod.join', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.0, questType: 'standard' }],
  ['hod.promotion', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.0, questType: 'standard' }],
  // Standard quests
  ['hod.quest.temple_vigil', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.04, questType: 'standard' }],
  ['hod.quest.purify_shrine', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.04, questType: 'standard' }],
  ['hod.quest.escort_pilgrims', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.04, questType: 'standard' }],
  ['hod.quest.slay_abomination', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.05, questType: 'standard' }],
  ['hod.quest.deliver_judgment', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.05, questType: 'standard' }],
  // Senior quests
  ['hod.senior.cleanse_corruption', { factionDefId: 'holy_order_dawn', minRank: 'knight', reputationReward: 0.06, questType: 'senior' }],
  ['hod.senior.lead_crusade', { factionDefId: 'holy_order_dawn', minRank: 'knight', reputationReward: 0.06, questType: 'senior' }],
  ['hod.senior.inquisition', { factionDefId: 'holy_order_dawn', minRank: 'knight', reputationReward: 0.06, questType: 'senior' }],
  // Elite quests
  ['hod.elite.holy_war', { factionDefId: 'holy_order_dawn', minRank: 'knight_commander', reputationReward: 0.08, questType: 'elite' }],
  ['hod.elite.divine_trial', { factionDefId: 'holy_order_dawn', minRank: 'knight_commander', reputationReward: 0.08, questType: 'elite' }],
  // Social encounters
  ['hod.social.dawn_prayer', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.02, questType: 'standard' }],
  ['hod.social.blessing_ceremony', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.02, questType: 'standard' }],
  ['hod.social.tend_wounded', { factionDefId: 'holy_order_dawn', minRank: 'squire', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Standard Quests ─────────────────────────────────────────────────────

export const HOLY_ORDER_DAWN_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [

  withEncounterContract({
    id: 'hod.quest.temple_vigil',
    name: 'Temple Vigil',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'star',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['temple', 'town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'star',
        duration: { min: 2, max: 2 },
        difficulty: HOD_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          '{name} takes the Low Watch — the hour the faithful don\'t name. ' +
          'The vigil candle burns short. {?has_artifact}{artifact:any} ' +
          'rests against the altar stone, a thing the Dawn will want a witness for.{/has_artifact}' +
          '{?no_artifact}The altar is empty but for what {they} brought — which is only {themself}.{/no_artifact}',
        successAfterimage:
          'The candle holds through the dark. {name} is still standing when the first grey shows at the window.',
        failureAfterimage:
          '{name} wakes to the bell. The rite will note this, in the quiet way.',
        failureMetadata: { reputationDelta: -0.02 },
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (HOD_DIFFICULTY_BASE + HOD_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: { reputationDelta: -0.03 },
        narrativeTemplate:
          'A shape moves in the sanctum. {name} draws the blade quietly — the Dawn\'s steel is not drawn loudly. ' +
          '{?has_ally}{ally:strongest} is at the outer door, which is most of the comfort one gets in this work.{/has_ally}' +
          '{?no_ally}There is only {name} between the intruder and the reliquary.{/no_ally}',
        successAfterimage:
          'The intruder falls or flees. The reliquary is untouched. {name} signs the temple log in the second hand.',
        failureAfterimage:
          'A relic is taken. {name} bears the loss before the order does — a mark that the rites will ask after for seasons.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The Dawn has asked for a vigil, and {name} has answered. ' +
        '{?has_faction}The {faction} captain will hear of it before dawn, one way or the other.{/has_faction}' +
        '{?no_faction}The faithful do not ask who keeps the vigil. They only ask that it is kept.{/no_faction}',
      success:
        'The vigil is held. The Dawn does not praise this. The Dawn notices it.',
      failure:
        'The vigil breaks. The order will speak of it in the quiet way — which is the way that lasts.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The vigil is closed. The Dawn takes its record, and {name} takes {theirs}.',
        changes: [],
        reactionPrompt: 'What does the god keep from the vigil?',
        reactions: [
          {
            id: 'hod.vigil.default.steady',
            label: 'Steady the hand that held.',
            intent: 'You steady {name}. The work was quiet — your mercy is quieter.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hod.vigil.default.withhold',
            label: 'Keep your hand back. The Dawn\'s work asks no god.',
            intent: 'You withdraw. The temple keeps its own weather.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
        byOutcome: {
          success: {
            overview:
              'The candle burns down to its socket and nothing comes for the reliquary. '
              + '{name} signs the temple log in the second hand and steps out into a grey that is only weather.',
            changes: [
              {
                id: 'vigil_held',
                kind: 'faction_reputation',
                title: 'The vigil was kept.',
                detail: 'The Dawn enters the night in its record. The reliquary sits where it sat.',
                polarity: 'gain',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
            ],
            reactionPrompt: 'What does the god do with a night that held?',
          },
          success_at_cost: {
            overview:
              'The reliquary is untouched and {name} is not. The intruder went out through the sanctum window '
              + 'and left a cut along the forearm that the rite has no words for. '
              + 'The log records a vigil kept. It does not record the arm.',
            changes: [
              {
                id: 'vigil_held_at_cost',
                kind: 'faction_reputation',
                title: 'The vigil was kept, and paid for.',
                detail:
                  'The Dawn records the reliquary safe. What the night took from {name} is not the order\'s to record.',
                polarity: 'mixed',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
            ],
            reactionPrompt: 'The relic is safe and the one who kept it is cut. Where does the god put its hand?',
            reactions: [
              {
                id: 'hod.vigil.cost.tend',
                label: 'Tend the arm before the order tends the record.',
                intent:
                  'You close what the night opened. The order will read the log and know nothing of this, '
                  + 'which is how {name} would want it read.',
                effects: [
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.vigil.cost.mark',
                label: 'Keep the face that went out the window.',
                intent:
                  'The intruder was seen, briefly, in candlelight. You hold the face where {name} will find it again.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                    label: 'Saw the one who came for the reliquary and did not take it',
                    revealFamilies: ['investigation', 'holy_order'],
                  },
                ],
                closeAfterSelection: false,
              },
              {
                id: 'hod.vigil.cost.withdraw',
                label: 'Withdraw. The arm heals or it does not.',
                intent: 'You let the temple keep its own weather, and {name} keep the cut.',
                effects: [],
                closeAfterSelection: true,
              },
            ],
          },
          failure: {
            overview:
              'The reliquary is lighter by one relic. The loss reads, in the second hand, as {name}\'s.',
            changes: [
              {
                id: 'relic_lost',
                kind: 'faction_reputation',
                title: 'A relic is missing.',
                detail: 'The order\'s inventory hand will find it. Tonight, only {name} knows.',
                polarity: 'negative',
              },
            ],
            reactionPrompt: 'What does the god do with the grey hour, and the empty altar?',
            reactions: [
              {
                id: 'hod.vigil.fail.witness',
                label: 'Witness the loss. Let the order find it at its own pace.',
                intent:
                  'You bear witness. The loss will be spoken of, in time — which is the order\'s way of keeping the shape of a thing.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                    label: 'Knows the hour the reliquary was breached',
                    revealFamilies: ['investigation', 'holy_order'],
                  },
                ],
                closeAfterSelection: false,
              },
              {
                id: 'hod.vigil.fail.seed',
                label: 'Plant the follow-up. The thief will not be hard to find, if the right eyes ask.',
                intent: 'You put a name in the ear of a ranger, or a guard. The thread pulls.',
                effects: [
                  {
                    kind: 'encounter_seed' as const,
                    templateId: 'hod.senior.cleanse_corruption',
                    delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS,
                    priority: 1.2,
                    seedLabel: 'The relic left a residue. Someone will find its edge.',
                  },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.vigil.fail.withdraw',
                label: 'Withdraw. The order will carry its own loss.',
                intent: 'You let the order have this one. Some wounds are theirs to keep.',
                effects: [],
                closeAfterSelection: true,
              },
            ],
          },
        },
      },
    },
  }),

  withEncounterContract({
    id: 'hod.quest.purify_shrine',
    name: 'Purify a Shrine',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'star',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['temple', 'town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'star',
        duration: { min: 2, max: 2 },
        difficulty: HOD_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A roadside shrine near {location} reads wrong to those who know how to read shrines. ' +
          '{name} crouches at the base of it and lays one hand flat on the stone. ' +
          '{?has_artifact}The weight of {artifact:any} shifts against {their} hip — the old things know each other.{/has_artifact}' +
          '{?no_artifact}There is only {their} hand and what the stone gives back, which is not warmth.{/no_artifact}',
        successAfterimage:
          'The corruption is found. It sits beneath the foundation stone, patient and cold.',
        failureAfterimage:
          'The source is not where the rite says it should be. The shrine remains wrong.',
      },
      {
        reach: 'star',
        duration: { min: 2, max: 2 },
        difficulty: (HOD_DIFFICULTY_BASE + HOD_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.04,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.40, bestowed_power: 0.30 },
            tagFilters: ['#star'],
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          '{name} speaks the rite of cleansing. The words are old — older than the order itself — and they ' +
          'carry weight when spoken true. {?has_rival}Word of what was found here will reach {rival:strongest}. ' +
          'Let it.{/has_rival}' +
          '{?no_rival}No one else stands at this shrine. The light comes or it does not.{/no_rival}',
        successAfterimage:
          'Light returns to the stone. The shadow beneath the shrine burns off without ash.',
        failureAfterimage:
          'The rite holds but the corruption does not move. More is needed here than one voice.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A shrine in the shadow of {location} has grown cold. {name} carries the rite of cleansing and the Dawn\'s authority to use it.',
      success:
        'The shrine is whole. The pilgrim road past {location} is clean again.',
      failure:
        'The corruption endures. The order will send someone with more years of rites behind them.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The rite is spoken. The road is cleaner for it.',
        changes: [],
        reactionPrompt: 'What does the god carry away from the shrine?',
        reactions: [
          {
            id: 'hod.shrine.default.bless',
            label: 'Bless the hand that held the rite.',
            intent: 'You strengthen the rite a little — a thumb on the scale of a thing well done.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hod.shrine.default.pass',
            label: 'Pass by. The Dawn witnessed it. That is enough.',
            intent: 'You let it be. The faithful do not need the god in every rite.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
        byOutcome: {
          success: {
            overview:
              'A shrine cleansed at {location}. The thing beneath the stone is gone — for now.',
            changes: [
              {
                id: 'shrine_cleansed',
                kind: 'faction_reputation',
                title: 'The shrine is whole.',
                detail: 'The order\'s records will note the cleansing.',
                polarity: 'positive',
              },
            ],
            reactionPrompt: 'What does the god press into the clean stone?',
            reactions: [
              {
                id: 'hod.shrine.success.mark',
                label: 'Leave a witness-mark. Something was here, and you saw it.',
                intent: 'The shrine is clean, but what {name} found in it should be remembered.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                    label: 'Knows what corrupted the shrine at {location}',
                    revealFamilies: ['investigation', 'holy_order', 'arcane'],
                  },
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.shrine.success.seed',
                label: 'The thing that placed this is still somewhere. Begin the search.',
                intent: 'You plant the thread. The follow-up comes at its own pace.',
                effects: [
                  {
                    kind: 'encounter_seed' as const,
                    templateId: 'hod.senior.inquisition',
                    delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS,
                    priority: 1.1,
                    seedLabel: 'The corruption at the shrine had a source. That source is still there.',
                    inheritContext: true, // the SAME source persists
                  },
                ],
                closeAfterSelection: true,
              },
            ],
          },
          failure: {
            overview:
              'The rite is spoken true and the stone does not answer it. Whatever sits beneath the foundation '
              + 'has roots the words do not reach. {name} closes the rite properly, because a rite left open is worse than a rite that failed.',
            changes: [
              {
                id: 'shrine_uncleansed',
                kind: 'faction_reputation',
                title: 'The shrine is still wrong.',
                detail: 'The Dawn will send a voice with more years behind it. The road past the shrine stays cold.',
                polarity: 'loss',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
            ],
            reactionPrompt: 'The rite held and the stone did not. What does the god do at a shrine that stayed cold?',
          },
          critical_failure: {
            overview:
              'The rite reaches the thing beneath the foundation and the thing reaches back. '
              + 'The stone goes warm under {name}\'s hand — warm, which is the wrong direction entirely — '
              + 'and the cold that leaves the shrine goes out along the pilgrim road instead of dying in the ground.',
            changes: [
              {
                id: 'shrine_corruption_spread',
                kind: 'faction_reputation',
                title: 'The corruption moved.',
                detail:
                  'The shrine at {location} is emptier and the road is worse. The Dawn will read this as a rite that woke what it meant to end.',
                polarity: 'loss',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
              {
                id: 'shrine_rite_recoil',
                kind: 'shell_state',
                title: 'The rite recoiled.',
                detail: '{name} spoke the words true and the words came back. That will sit in the hand for a long while.',
                polarity: 'loss',
                concepts: [
                  { text: 'the words', tooltipId: 'reach.star' },
                ],
              },
            ],
            reactionPrompt: 'The cleansing moved the rot instead of ending it. What does the god do with a rite that turned?',
            reactions: [
              {
                id: 'hod.shrine.critfail.follow',
                label: 'Follow the cold down the road. It went somewhere.',
                intent:
                  'You track what left the shrine. It is travelling, and travelling things arrive.',
                effects: [
                  {
                    kind: 'encounter_seed' as const,
                    templateId: 'hod.senior.cleanse_corruption',
                    delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS,
                    priority: 1.6,
                    seedLabel: 'What the failed rite at {location} drove out of the shrine is moving along the pilgrim road.',
                    inheritContext: true, // the SAME corruption, relocated
                  },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.shrine.critfail.bear',
                label: 'Let {name} carry what the rite did. Do not soften it.',
                intent:
                  'You leave the knowledge where it landed. The faithful do not admit doubt aloud — but a hand that felt the stone go warm remembers.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY + 0.15,
                    label: 'Spoke the rite of cleansing at {location} and felt it answered from the wrong side',
                    revealFamilies: ['investigation', 'holy_order', 'arcane'],
                  },
                ],
                closeAfterSelection: false,
              },
              {
                id: 'hod.shrine.critfail.withdraw',
                label: 'Withdraw. The order will find the road on its own.',
                intent: 'You take your hand off the shrine. What was loosed there is the order\'s to meet.',
                effects: [],
                closeAfterSelection: true,
              },
            ],
          },
        },
      },
    },
  }),

  withEncounterContract({
    id: 'hod.quest.escort_pilgrims',
    name: 'Escort Pilgrims',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['temple', 'town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'heart',
        duration: { min: 2, max: 2 },
        difficulty: HOD_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The faithful who gather outside the temple gate at {location} are not soldiers. ' +
          '{name} counts them — too many for a clean escort, just enough for a pilgrimage — and ' +
          'says what the order says in these moments: that the road is safe, that the Dawn walks with them. ' +
          '{?has_faction}The {faction} order has walked this road before. The pilgrims know it.{/has_faction}' +
          '{?no_faction}They look at {name} and believe it because they need to.{/no_faction}',
        successAfterimage:
          'They move together. The slowest ones keep pace. The road is easier when the fear is shared.',
        failureAfterimage:
          'They spread across the road. Three families will not speak to the others. ' +
          'The journey begins badly.',
      },
      {
        reach: 'iron',
        duration: { min: 3, max: 3 },
        difficulty: (HOD_DIFFICULTY_BASE + HOD_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
          },
        },
        failureMetadata: { reputationDelta: -0.04 },
        narrativeTemplate:
          'Shadows on the road ahead. The pilgrims go quiet in the way people go quiet when they recognize danger. ' +
          '{name} draws the blade and moves to the front — not running, because the faithful do not run toward bandits. ' +
          '{?has_ally}The {ally:strongest} closes from the left. They have done this before.{/has_ally}' +
          '{?no_ally}{name} alone between the road and the pilgrims behind.{/no_ally}',
        successAfterimage:
          'Pilgrims delivered. The high temple receives them at the gate. The Dawn was with them on the road.',
        failureAfterimage:
          'The attack costs something. The pilgrims arrive, but some arrive carrying more than faith.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} walks the road with the faithful. ' +
        'The vigil for a pilgrim escort is not held in a temple — it is held on the road, in the dark, with strangers.',
      success:
        'They arrive. The high temple opens its gate. The road behind {name} is empty and clean.',
      failure:
        'They arrive. Some do not arrive whole. The rite for what was lost is spoken at the gate.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The pilgrims are delivered. The road behind {name} is empty.',
        changes: [],
        reactionPrompt: 'What does the god leave at the gate of the high temple?',
        reactions: [
          {
            id: 'hod.pilgrims.bless_road',
            label: 'Bless the road they walked.',
            intent:
              'You sanctify the road a little. The next pilgrims will find it slightly easier, ' +
              'though they will not know why.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hod.pilgrims.watch_gate',
            label: 'Watch the gate close. Bear witness.',
            intent: 'You witness. The Dawn does not need to act in every moment.',
            effects: [],
            closeAfterSelection: true,
          },
          {
            id: 'hod.pilgrims.strengthen',
            label: 'Strengthen {name}\'s hand for the road home.',
            intent: 'The escort is done. The walk back alone deserves something.',
            effects: [
              { kind: 'recent_event' as const, eventType: 'ripple_consequence',
                message: 'The Dawn steadied {name} on the road. The faith is a little deeper now.',
                significance: 0.3 },
            ],
            closeAfterSelection: true,
          },
        ],
        byOutcome: {
          success: {
            overview:
              'Every pilgrim who left the gate at {location} walks through the high temple gate at the other end. '
              + 'The slowest of them arrives last and arrives whole, which is the whole of the work.',
            changes: [
              {
                id: 'pilgrims_delivered',
                kind: 'faction_reputation',
                title: 'The pilgrims arrived whole.',
                detail: 'The arrival log at the high temple carries every name that left. The Dawn walked the road.',
                polarity: 'gain',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
            ],
            reactionPrompt: 'The road gave nothing up. What does the god leave at the high temple gate?',
          },
          critical_success: {
            overview:
              'The shadows on the road break before the blade is dry, and they break loudly. '
              + 'By the time the pilgrims reach the high temple the story is already ahead of them: '
              + 'the road past {location} is a road the Dawn walks. The next pilgrims will hear that before they set out.',
            changes: [
              {
                id: 'pilgrim_road_secured',
                kind: 'faction_reputation',
                title: 'The road itself is safer.',
                detail:
                  'What broke on this road will not re-form quickly. The Dawn gains a road, not only an escort.',
                polarity: 'gain',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
              {
                id: 'pilgrim_escort_renown',
                kind: 'reputation',
                title: 'The faithful will ask for {name} by name.',
                detail: 'Pilgrims tell the story of who stood at the front of the road. Iron is what they saw and Iron is what they name.',
                polarity: 'gain',
                concepts: [
                  { text: 'Iron', tooltipId: 'reach.iron' },
                ],
              },
            ],
            reactionPrompt: 'The road is broken open and the story is already walking. What does the god do with it?',
            reactions: [
              {
                id: 'hod.pilgrims.crit.consecrate',
                label: 'Consecrate the road while the story is still true.',
                intent:
                  'You put weight behind the telling. A road the faithful believe is safe becomes a road they will walk, '
                  + 'and a road they walk stays clear.',
                effects: [
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 2 },
                  {
                    kind: 'recent_event' as const,
                    eventType: 'ripple_consequence',
                    message: 'The pilgrim road past {location} is spoken of as the Dawn\'s road now. {name} made it so on foot.',
                    significance: 0.6,
                  },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.pilgrims.crit.mark',
                label: 'Keep what the attackers gave away when they broke.',
                intent:
                  'Men who run leave their sign behind them — a badge, a direction, a name shouted at the wrong moment. {name} was watching.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                    label: 'Knows who sent the men who broke on the pilgrim road near {location}',
                    revealFamilies: ['investigation', 'holy_order'],
                  },
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
                ],
                closeAfterSelection: false,
              },
              {
                id: 'hod.pilgrims.crit.pass',
                label: 'Withdraw. Let the faithful own the road they walked.',
                intent: 'You take nothing. The pilgrims will remember it as theirs, and it was.',
                effects: [],
                closeAfterSelection: true,
              },
            ],
          },
          failure: {
            overview:
              'The attack on the road cost someone. The pilgrims arrived — most of them — but the wound from the road travels with them.',
            changes: [
              {
                id: 'pilgrims_attacked',
                kind: 'faction_reputation',
                title: 'Pilgrims were attacked.',
                detail: 'The order will hear about it from the arrival log at the high temple.',
                polarity: 'loss' as const,
              },
            ],
            reactionPrompt: 'What does the god carry away from the pilgrim road?',
            reactions: [
              {
                id: 'hod.pilgrims.fail.mark',
                label: 'Mark the road. Something happened there that should be remembered.',
                intent:
                  'The attack left a wound the road won\'t shed quickly. ' +
                  'You preserve the memory — not to punish, but so the order knows where the dark sits.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'soul_diminishment',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                    label: 'Was present when pilgrims were attacked on the road near {location}',
                    revealFamilies: ['holy_order', 'investigation'],
                  },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.pilgrims.fail.seed',
                label: 'Those who attacked the road are still there.',
                intent: 'You plant the thread. The order will send someone who asks the right questions at the right crossroads.',
                effects: [
                  {
                    kind: 'encounter_seed' as const,
                    templateId: 'hod.quest.slay_abomination',
                    delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS,
                    priority: 1.1,
                    seedLabel: 'Bandits who attacked pilgrims on the road near {location} have not been cleared.',
                    inheritContext: true, // the SAME bandits remain
                  },
                ],
                closeAfterSelection: true,
              },
            ],
          },
        },
      },
    },
  }),

  withEncounterContract({
    id: 'hod.quest.slay_abomination',
    name: 'Slay the Abomination',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['temple', 'town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: (HOD_DIFFICULTY_BASE + 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Reports reach the order: something moves through {location} that should not move. ' +
          '{name} follows the signs — the wrong-smelling gutters, the animals that left, ' +
          'the people who will not say what they saw but will say where. ' +
          '{?has_faction}The {faction} order has protocols for this. They help, and they narrow the search.{/has_faction}' +
          '{?no_faction}{name} works alone, which is the harder way and the honest one.{/no_faction}',
        successAfterimage:
          'Its lair found. The stench of the thing is unmistakable — corruption made flesh, ' +
          'settled into a place and making it wrong.',
        failureAfterimage:
          'The creature is elusive. It strikes from shadow and withdraws. {name} has a direction, not a place.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (HOD_DIFFICULTY_BASE + HOD_DIFFICULTY_STEP + 5) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.05,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
            tagFilters: ['#iron', '#star'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.03,
          rewardPool: { categoryWeights: { condition: 1.0 }, tagFilters: ['#wound'] },
        },
        narrativeTemplate:
          '{name} enters the lair and does not announce it — the blade is drawn, the rite of confrontation ' +
          'is spoken under the breath, and then it is only {name} and the thing in the dark. ' +
          '{?has_rival}The darkness here smells like {rival:strongest}\'s handiwork. That is noted.{/has_rival}' +
          '{?no_rival}There is no other hand in this. It is what it looks like, and that is almost a mercy.{/no_rival}',
        successAfterimage:
          'The creature falls. Its corruption fades as it goes — like smoke clearing from a room. ' +
          'The Dawn was here.',
        failureAfterimage:
          '{name} retreats, wounded. The thing is still there. The order will send more.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'Something walks in {location} that the order has a word for. {name} is sent to find it and end it.',
      success:
        'The abomination is gone. The light that comes back to the place afterward is real light.',
      failure:
        'The creature endures. The rite of cleansing for a failed hunt is spoken quietly, and without witnesses.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The hunt is closed. The order\'s record is updated.',
        changes: [],
        reactionPrompt: 'What does the god keep from the hunt?',
        reactions: [
          {
            id: 'hod.slay.default.steady',
            label: 'Steady {name}\'s hand for the next one.',
            intent: 'The work is done. You strengthen the blade for what follows.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hod.slay.default.let_be',
            label: 'Let the order carry this.',
            intent: 'The order has its rites for a successful hunt. You are not needed here.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
        byOutcome: {
          success: {
            overview:
              'The abomination is slain. The order will want to know what made it.',
            changes: [
              {
                id: 'creature_slain',
                kind: 'faction_reputation',
                title: 'The creature is gone.',
                detail: 'The order\'s records note the slaying and the location.',
                polarity: 'positive',
              },
            ],
            reactionPrompt: 'What does the god take from the slaying? The darkness, or the light?',
            reactions: [
              {
                id: 'hod.slay.success.witness',
                label: 'Bear witness to what {name} found in the lair.',
                intent: 'What made this creature is still out there. The witnessing matters.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY + 0.1,
                    label: 'Saw what made the creature — the source of the corruption in {location}',
                    revealFamilies: ['investigation', 'holy_order'],
                  },
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.slay.success.seed',
                label: 'There is more where this came from. Begin the cleanse.',
                intent: 'You plant the thread. The inquisition starts from here.',
                effects: [
                  {
                    kind: 'encounter_seed' as const,
                    templateId: 'hod.senior.inquisition',
                    delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS + 3,
                    priority: 1.3,
                    seedLabel: 'The thing in {location} was not alone. The source is still active.',
                    inheritContext: true, // the SAME source is active
                  },
                ],
                closeAfterSelection: true,
              },
            ],
          },
          failure: {
            overview:
              '{name} comes back up out of the lair carrying a wound and no head. '
              + 'The thing is still down there, and it knows now what the order sends. '
              + 'The rite of a failed hunt is spoken at the mouth of the place, briefly, and without witnesses.',
            changes: [
              {
                id: 'abomination_endures',
                kind: 'faction_reputation',
                title: 'The creature is still in {location}.',
                detail: 'The Dawn will send a heavier hand. Until it does, the gutters stay wrong.',
                polarity: 'loss',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
            ],
            reactionPrompt: 'The hunt closed with the thing still breathing. What does the god keep from it?',
          },
          critical_failure: {
            overview:
              'The thing in the dark does not merely hold — it takes the hunt away from {name} entirely. '
              + 'The retreat is not a withdrawal in good order; it is a run, up through the wrong-smelling passages, '
              + 'with the blade left where it fell. And the creature does not stay in its lair afterward. It follows the noise out into {location}.',
            changes: [
              {
                id: 'abomination_loosed',
                kind: 'faction_reputation',
                title: 'The creature left the lair.',
                detail:
                  'It is in the streets of {location} now, not under them. The Dawn will be answering for this hunt for a long season.',
                polarity: 'loss',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
              {
                id: 'abomination_blade_lost',
                kind: 'item',
                title: 'The blade stayed in the dark.',
                detail: 'A blade of the order is down there with the thing that took it. Iron does not forgive being left.',
                polarity: 'loss',
                concepts: [
                  { text: 'Iron', tooltipId: 'reach.iron' },
                ],
              },
            ],
            reactionPrompt: 'The hunter is running and the hunted is out. Where does the god put its hand?',
            reactions: [
              {
                id: 'hod.slay.critfail.raise',
                label: 'Raise the alarm through the faithful before it reaches the houses.',
                intent:
                  'You push the warning ahead of the thing. The order will meet it in the open, which is not where it wanted to be met.',
                effects: [
                  {
                    kind: 'encounter_seed' as const,
                    templateId: 'hod.senior.lead_crusade',
                    delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS,
                    priority: 1.7,
                    seedLabel: 'The creature that broke the hunt is loose in {location} and the order knows it.',
                    inheritContext: true, // the SAME creature, now in the open
                  },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.slay.critfail.steady',
                label: 'Steady the one who ran. The running is not the sin.',
                intent:
                  'You take the shame out of the retreat and leave the fear, which is the useful half. {name} will go back down there one day.',
                effects: [
                  {
                    kind: 'recent_event' as const,
                    eventType: 'ripple_consequence',
                    message: 'The Dawn steadied {name} after the lair. The blade is gone; the hand is not.',
                    significance: 0.5,
                  },
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.slay.critfail.withdraw',
                label: 'Withdraw. Let the order count what this cost.',
                intent: 'You stand back. The faithful will speak of the hunt in the quiet way, and the quiet way lasts.',
                effects: [],
                closeAfterSelection: true,
              },
            ],
          },
        },
      },
    },
  }),

  withEncounterContract({
    id: 'hod.quest.deliver_judgment',
    name: 'Deliver Judgment',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'star',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['temple', 'town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: (HOD_DIFFICULTY_BASE + 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A charge of heresy brought before the order at {location}. {name} is assigned to investigate ' +
          'before judgment is spoken — the order does not convict on accusation alone, which is the one ' +
          'mercy the accused can rely on. ' +
          '{?has_faction}The {faction} order has seen this before. The truth tends to land where the testimony is most careful.{/has_faction}' +
          '{?no_faction}{name} works alone through the witness accounts. Truth leaves marks if you know what marks look like.{/no_faction}',
        successAfterimage:
          'Evidence gathered. The truth is not comfortable, but it is clear.',
        failureAfterimage:
          'The testimony is contradictory. The truth is somewhere in it, but {name} cannot say where.',
      },
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: (HOD_DIFFICULTY_BASE + HOD_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.05,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.40, bestowed_power: 0.30 },
          },
        },
        failureMetadata: { reputationDelta: -0.04 },
        narrativeTemplate:
          '{name} stands before the assembled. The verdict is not a verdict until spoken aloud in the order\'s words. ' +
          'The words are old and they carry weight. {?has_rival}One of the witnesses is known to {rival:strongest}. ' +
          'That will be remembered.{/has_rival}' +
          '{?no_rival}The silence before the verdict is the longest silence {name} has known in this work.{/no_rival}',
        successAfterimage:
          'Justice is spoken. The faithful are not satisfied — justice never satisfies — but they are reassured.',
        failureAfterimage:
          'The verdict is questioned before it is complete. Doubt spreads through the assembled. ' +
          'The order will revisit this.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A charge is brought to the order at {location}. {name} is sent to hear it, ' +
        'investigate it, and speak what the order must speak. The rite of judgment is not given to those who cannot bear it.',
      success:
        'Judgment spoken. The accused knows what they have done. The faithful know the order held its word.',
      failure:
        'Judgment delayed. The order will speak of this as a wound that needs time, but {name} knows what it costs.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The judgment is entered in the order\'s second hand. The rite is complete.',
        changes: [],
        reactionPrompt: 'What does the god keep from the judgment?',
        reactions: [
          {
            id: 'hod.judgment.default.witness',
            label: 'Bear witness. The record is true.',
            intent: 'You mark the moment. The faithful held the rite.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hod.judgment.default.pass',
            label: 'Pass by without marking. Justice stands on its own.',
            intent: 'You withdraw. The verdict is the verdict.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
        byOutcome: {
          success: {
            overview:
              'Judgment spoken and entered. The record is clear. The resentment takes longer to settle than the verdict.',
            changes: [
              {
                id: 'judgment_spoken',
                kind: 'faction_reputation',
                title: 'Judgment spoken.',
                detail: 'The order\'s record is updated. The faithful know the verdict held.',
                polarity: 'gain' as const,
              },
            ],
            reactionPrompt: 'What does the god press into the spoken verdict?',
            reactions: [
              {
                id: 'hod.judgment.success.mark',
                label: 'Mark the one who received the verdict. They will remember it differently than {name} does.',
                intent:
                  'The judgment was correct — but correct judgments land differently on the one who receives them. ' +
                  'The mark is not punitive. It is honest.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'reputation_note',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY - 0.1,
                    label: 'Delivered the order\'s judgment at {location}; the verdict was spoken and held',
                    revealFamilies: ['holy_order', 'investigation'],
                  },
                ],
                closeAfterSelection: false,
              },
              {
                id: 'hod.judgment.success.seed',
                label: 'A verdict always has a sequel. Plant the thread.',
                intent:
                  'The accused accepted the judgment in the hall. What made the judgment necessary is still somewhere. ' +
                  'You plant the thread for the order to follow.',
                effects: [
                  {
                    kind: 'encounter_seed' as const,
                    templateId: 'hod.senior.cleanse_corruption',
                    delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 2,
                    priority: 1.0,
                    seedLabel: 'The judgment at {location} was the symptom. The source of the heresy has not been addressed.',
                    inheritContext: true, // the SAME heresy source
                  },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.judgment.success.pass',
                label: 'Withdraw. The verdict stands on its own.',
                intent: 'You withdraw. Justice is a human thing — it does not require the god\'s hand to hold it upright.',
                effects: [],
                closeAfterSelection: true,
              },
            ],
          },
          success_at_cost: {
            overview:
              'The verdict is spoken and it holds — and the testimony that made it hold belonged to a witness who will not be '
              + 'able to stay in {location} now. The assembled accept the judgment. They also watch the witness leave. '
              + 'Both of those things happened, and the record keeps only the first.',
            changes: [
              {
                id: 'judgment_held_at_cost',
                kind: 'faction_reputation',
                title: 'The judgment held. A witness paid for it.',
                detail:
                  'The Dawn enters a verdict upheld. What upholding it cost the one who testified goes in no hand at all.',
                polarity: 'mixed',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
              {
                id: 'judgment_witness_exposed',
                kind: 'future_hook',
                title: 'The witness is known.',
                detail: 'Everyone in the hall heard who spoke. The Eye of it is that {name} knew that before asking.',
                polarity: 'loss',
                concepts: [
                  { text: 'Eye', tooltipId: 'reach.eye' },
                ],
              },
            ],
            reactionPrompt: 'The verdict stands and the one who made it stand is exposed. What does the god do?',
            reactions: [
              {
                id: 'hod.judgment.cost.shield',
                label: 'Put your hand between the witness and what comes next.',
                intent:
                  'You cover the one who spoke. The order asked for truth and did not ask what truth costs; you can answer the second part.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'reputation_note',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY - 0.1,
                    label: 'Testified in the judgment at {location} and was not left to stand alone',
                    revealFamilies: ['holy_order', 'investigation'],
                  },
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.judgment.cost.let_stand',
                label: 'Let the cost stand where it fell. Justice is not free and should not look free.',
                intent:
                  'You leave it. A verdict that cost nobody anything teaches the faithful the wrong thing about verdicts.',
                effects: [
                  { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.judgment.cost.seed',
                label: 'The one who brought the charge has not been examined. Plant that.',
                intent:
                  'You turn the order\'s eye around. A charge that needed a ruined witness to prove is a charge worth looking at from the other end.',
                effects: [
                  {
                    kind: 'encounter_seed' as const,
                    templateId: 'hod.senior.inquisition',
                    delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 2,
                    priority: 1.2,
                    seedLabel: 'The accuser at the {location} judgment was never examined. The order has not asked why the charge was brought.',
                    inheritContext: true, // the SAME accuser
                  },
                ],
                closeAfterSelection: true,
              },
            ],
          },
          failure: {
            overview:
              'The verdict was questioned in open assembly. This will be noted.',
            changes: [
              {
                id: 'verdict_challenged',
                kind: 'faction_reputation',
                title: 'The verdict did not hold.',
                detail: 'The order hears these things eventually.',
                polarity: 'loss' as const,
              },
            ],
            reactionPrompt: 'What does the god do when the verdict falls?',
            reactions: [
              {
                id: 'hod.judgment.fail.shadow',
                label: 'Plant a doubt in the one who challenged the verdict.',
                intent: 'The challenger knows something {name} does not. That is a thread worth following.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'betrayal',
                    severity: FACTION_PROSE_HIDDEN_MARK_BETRAYAL_SEVERITY - 0.2,
                    label: 'Challenged the order\'s verdict in public assembly',
                    revealFamilies: ['investigation', 'holy_order'],
                  },
                ],
                closeAfterSelection: false,
              },
              {
                id: 'hod.judgment.fail.withdraw',
                label: 'Withdraw. Let the order correct its own record.',
                intent: 'The order has protocols for a failed verdict. They do not need the god\'s hand in this.',
                effects: [],
                closeAfterSelection: true,
              },
            ],
          },
        },
      },
    },
  }),
];

// ─── Senior Quests ───────────────────────────────────────────────────────

export const HOLY_ORDER_DAWN_SENIOR_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'hod.senior.cleanse_corruption',
    name: 'Cleanse Deep Corruption',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'star',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['temple', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'star',
        duration: { min: 3, max: 3 },
        difficulty: HOD_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Beneath a temple in {location} something old has woken, or perhaps it was never asleep — ' +
          'the order\'s scholars say it may have been here before the temple was built. ' +
          '{name} descends with the rite of descent in memory and the blade at hand. ' +
          '{?has_artifact}The {artifact:any} reads the darkness before the eyes do.{/has_artifact}' +
          '{?no_artifact}The torch is the only thing between {name} and what waits below.{/no_artifact}',
        successAfterimage:
          '{name} reaches the heart of it. It pulses with something between cold and malice — ' +
          'an ancient patience that has waited long enough to stop counting.',
        failureAfterimage:
          'The darkness is disorienting. {name} surfaces three hours later unable to say how far down it goes.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (HOD_SENIOR_BASE + HOD_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.06,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
            tagFilters: ['#star', '#iron'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.04,
          rewardPool: { categoryWeights: { condition: 1.0 }, tagFilters: ['#wound'] },
        },
        narrativeTemplate:
          '{name} speaks the rite of purging from the root of the corruption. The words require the full voice — ' +
          'not the careful voice the order uses in temples, but the full voice that the founders used when the order ' +
          'was new and the world had not yet learned to be patient. ' +
          '{?has_rival}The corruption smells like something {rival:strongest} has touched. ' +
          'That is noted.{/has_rival}' +
          '{?no_rival}There is no name to put to what made this. There is only the ending of it.{/no_rival}',
        successAfterimage:
          'Light fills the underground. {name} climbs out and does not look back.',
        failureAfterimage:
          'The evil endures. {name} retreats to plan anew — which is not failure, but feels like it.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The order sends {name} down into the dark beneath a temple at {location}. ' +
        'Corruption at the root requires the full rite. The order does not explain what is waiting below.',
      success:
        'The corruption is destroyed. Light fills the underground for the first time in a long time.',
      failure:
        'The evil endures. The order will speak of it as a wound that requires more rites than one person carries.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The rite of purging is spoken. The order\'s record is updated.',
        changes: [],
        reactionPrompt: 'What does the god keep from the deep?',
        reactions: [
          {
            id: 'hod.cleanse.default.witness',
            label: 'Bear witness. {name} has done the work the Dawn requires.',
            intent: 'You witness. The rite is complete.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hod.cleanse.default.pass',
            label: 'Pass by. The rite speaks for itself.',
            intent: 'You withdraw. The faithful do not need the god in every rite.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
        byOutcome: {
          success: {
            overview:
              'The corruption beneath {location} is gone. What remains is the memory of what was there.',
            changes: [
              {
                id: 'corruption_cleansed',
                kind: 'faction_reputation',
                title: 'The deep corruption is gone.',
                detail: 'The order\'s records will note the cleansing and the depth.',
                polarity: 'positive',
              },
            ],
            reactionPrompt: 'What does the god press into the clean dark where the corruption was?',
            reactions: [
              {
                id: 'hod.cleanse.success.mark',
                label: 'Mark what was found there. The knowledge is useful.',
                intent: 'The thing below left traces. The mark preserves them.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY + 0.15,
                    label: 'Knows the nature of the deep corruption beneath the temple at {location}',
                    revealFamilies: ['investigation', 'holy_order', 'arcane'],
                  },
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 2 },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.cleanse.success.seal',
                label: 'Seal the knowledge away. Some things are better not remembered.',
                intent: 'You let the dark stay dark. The knowledge is more dangerous than the corruption was.',
                effects: [
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
                ],
                closeAfterSelection: true,
              },
            ],
          },
          failure: {
            overview:
              'The full rite is spoken to its end in the dark beneath {location}, and the dark takes it the way a deep well takes a stone. '
              + '{name} climbs back up into the temple with the rite complete and nothing to show that it was.',
            changes: [
              {
                id: 'deep_corruption_endures',
                kind: 'faction_reputation',
                title: 'The corruption at the root endures.',
                detail: 'The Dawn will need more rites than one throat carries. The under-temple stays shut.',
                polarity: 'loss',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
            ],
            reactionPrompt: 'The rite was whole and the dark was wider. What does the god carry up out of it?',
          },
          critical_failure: {
            overview:
              'The rite breaks in the middle, below ground, with no one else on the stair. '
              + 'What was rooted under the temple at {location} comes up through the break — not at {name}, past {name} — '
              + 'and the light that finally fills the under-temple is the light of the order burning what it cannot cleanse.',
            changes: [
              {
                id: 'deep_corruption_surfaced',
                kind: 'faction_reputation',
                title: 'The root came up.',
                detail:
                  'The temple at {location} is a fire and a closed door. The Dawn loses a house to keep a city.',
                polarity: 'loss',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
              {
                id: 'deep_rite_broken',
                kind: 'shell_state',
                title: 'The rite broke in the mouth that spoke it.',
                detail: 'A full purging left unfinished sits in the one who left it. Star does not close what it half-opens.',
                polarity: 'loss',
                concepts: [
                  { text: 'Star', tooltipId: 'reach.star' },
                ],
              },
            ],
            reactionPrompt: 'The under-temple is burning and the rite is unfinished in {name}. What does the god do?',
            reactions: [
              {
                id: 'hod.cleanse.critfail.close',
                label: 'Close the rite yourself. Finish what the throat could not.',
                intent:
                  'You speak the last of it where {name} could not. The order will never know a god finished its rite — and the rite is finished.',
                effects: [
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 2 },
                  {
                    kind: 'recent_event' as const,
                    eventType: 'ripple_consequence',
                    message: 'The purging beneath {location} was closed after the fire. No hand in the order can say by whom.',
                    significance: 0.7,
                  },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.cleanse.critfail.mark',
                label: 'Keep what came up the stair. It had a shape.',
                intent:
                  'You hold the shape of the thing that passed. It went somewhere, and things that go somewhere arrive.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY + 0.2,
                    label: 'Saw what came up the stair when the purging broke beneath {location}',
                    revealFamilies: ['investigation', 'holy_order', 'arcane'],
                  },
                  {
                    kind: 'encounter_seed' as const,
                    templateId: 'hod.senior.inquisition',
                    delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 2,
                    priority: 1.5,
                    seedLabel: 'What came up the stair beneath {location} when the purging broke has not been found.',
                    inheritContext: true, // the SAME root, now above ground
                  },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.cleanse.critfail.withdraw',
                label: 'Withdraw. Let the order burn its own house.',
                intent: 'You stand back from the fire. The faithful built that temple and the faithful will decide what it was worth.',
                effects: [],
                closeAfterSelection: true,
              },
            ],
          },
        },
      },
    },
  },

  {
    id: 'hod.senior.lead_crusade',
    name: 'Lead a Crusade',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        reach: 'heart',
        duration: { min: 2, max: 2 },
        difficulty: HOD_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A threat to the faith gathers beyond {location}. The Grand Master has named it and given {name} ' +
          'the authority to answer it. The rally is held in the courtyard of the order\'s hall — ' +
          'knights who came, knights who sent word they are coming, and knights who have not yet decided. ' +
          '{?has_faction}The {faction} rolls are checked against the names called. The absences are noted.{/has_faction}' +
          '{?no_faction}{name} reads the assembled and knows: this is what the order gives.{/no_faction}',
        successAfterimage:
          'The order rides with purpose. The faithful who were watching from the gate go back inside reassured.',
        failureAfterimage:
          'Few answer the call. The crusade will ride undermanned, which is not the same as not riding.',
      },
      {
        reach: 'iron',
        duration: { min: 3, max: 3 },
        difficulty: (HOD_SENIOR_BASE + HOD_DIFFICULTY_STEP) / 100,
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
        failureMetadata: {
          reputationDelta: -0.06,
          rewardPool: { categoryWeights: { condition: 1.0 }, tagFilters: ['#wound'] },
        },
        narrativeTemplate:
          '{name} leads the assault. The gates of the enemy\'s stronghold are the point everything turns on. ' +
          'The blade, the rite of battle spoken at the front — not quietly — and then the gates. ' +
          '{?has_rival}The enemy at the gate has a face {rival:strongest} will recognize. ' +
          'That is remembered on the field.{/has_rival}' +
          '{?no_rival}The enemy is named and numbered. {name} has fought in worse odds with cleaner hands.{/no_rival}',
        successAfterimage:
          'The stronghold falls. The order\'s banner is raised from the walls and the faithful inside open the gates.',
        failureAfterimage:
          'The assault is repelled. Heavy losses among the faithful. The order retreats with its wounded.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The Grand Master has called it: crusade. {name} is given the word and the authority to use it, ' +
        'which is the order\'s way of saying the rest is {their} problem.',
      success:
        'The stronghold falls. The enemy of the faith has lost its house. The Dawn was with them.',
      failure:
        'The assault is turned. The order speaks of it as a strategic withdrawal, which is what you call a defeat when you intend to try again.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The crusade is concluded. The order counts its faithful.',
        changes: [],
        reactionPrompt: 'What does the god press into the hands that held the order together?',
        reactions: [
          {
            id: 'hod.crusade.strengthen',
            label: 'Strengthen the hand that bore the banner.',
            intent: 'The work is done. You strengthen the one who carried it.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hod.crusade.witness',
            label: 'Bear witness. Let the faithful carry it.',
            intent: 'You witness. The order will remember without the god\'s hand in it.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hod.crusade.pass',
            label: 'Pass by. The crusade is the order\'s work, not yours.',
            intent: 'You withdraw. The faithful do not need the god in every battle.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
        byOutcome: {
          success: {
            overview:
              'The stronghold falls. The enemy of the faith has lost its house. What was found inside will matter to the order\'s records.',
            changes: [
              {
                id: 'crusade_succeeded',
                kind: 'faction_reputation',
                title: 'The crusade was victorious.',
                detail: 'The order\'s banner is raised. The faith holds in this region.',
                polarity: 'gain' as const,
              },
            ],
            reactionPrompt: 'What does the god press into the moment the gates opened?',
            reactions: [
              {
                id: 'hod.crusade.success.mark',
                label: 'Mark what {name} found inside the stronghold.',
                intent:
                  'The stronghold had its secrets. What {name} found inside before the order took inventory ' +
                  'is knowledge the second hand will not record.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY + 0.05,
                    label: 'Knows what was found in the enemy stronghold after the crusade at {location}',
                    revealFamilies: ['holy_order', 'investigation'],
                  },
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 2 },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.crusade.success.pass',
                label: 'Let the order have this. It is their victory.',
                intent: 'You withdraw. The victory belongs to the faithful who held — and the cost belongs to them too.',
                effects: [
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
                ],
                closeAfterSelection: true,
              },
            ],
          },
          critical_success: {
            overview:
              'The gates do not hold long enough to be called a siege. What breaks inside the stronghold is not only the wall — '
              + 'the cause breaks with it, in front of its own people, and the ones who carried it put the banner down '
              + 'rather than carry it another day. {name} walks in through a gate nobody is defending.',
            changes: [
              {
                id: 'crusade_cause_broken',
                kind: 'faction_reputation',
                title: 'The enemy cause broke, not only its house.',
                detail:
                  'The Dawn takes a stronghold and the belief that held it. The second is the one the order will still have next season.',
                polarity: 'gain',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
              {
                id: 'crusade_banner_raised',
                kind: 'reputation',
                title: 'The faithful know who opened the gate.',
                detail: 'A crusade ends the way its first hand ended it. Iron opened that gate and the order counted the hand.',
                polarity: 'gain',
                concepts: [
                  { text: 'Iron', tooltipId: 'reach.iron' },
                ],
              },
            ],
            reactionPrompt: 'The house and the cause both fell. What does the god do at an open gate?',
            reactions: [
              {
                id: 'hod.crusade.crit.mercy',
                label: 'Stay the hand at the open gate. They put the banner down.',
                intent:
                  'You hold {name} at the threshold. The ones inside surrendered a belief, which is harder than surrendering a wall, '
                  + 'and the order does not need to kill them to have won.',
                effects: [
                  { kind: 'reputation_tally' as const, key: 'heart.positive', delta: 2 },
                  {
                    kind: 'recent_event' as const,
                    eventType: 'ripple_consequence',
                    message: 'The crusade at {location} ended at an open gate without a sack. The story of that will travel further than the victory.',
                    significance: 0.7,
                  },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.crusade.crit.claim',
                label: 'Take the stronghold\'s records before the order takes inventory.',
                intent:
                  'You reach the archive first. What a broken cause wrote down about itself is worth more than its walls.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY + 0.2,
                    label: 'Read the enemy\'s own records at {location} before the order inventoried them',
                    revealFamilies: ['holy_order', 'investigation', 'intrigue'],
                  },
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 2 },
                ],
                closeAfterSelection: false,
              },
              {
                id: 'hod.crusade.crit.pass',
                label: 'Withdraw. The victory is the order\'s and should look like it.',
                intent: 'You take nothing from the gate. The faithful carried this, and a god at the front of it would make it smaller.',
                effects: [],
                closeAfterSelection: true,
              },
            ],
          },
          failure: {
            overview:
              'The assault is repelled. The order retreats in order, which is the best thing that can be said of it. ' +
              'What {name} saw at the wall will not be spoken of publicly — but it should be recorded somewhere.',
            changes: [
              {
                id: 'crusade_failed',
                kind: 'faction_reputation',
                title: 'The assault was repelled.',
                detail: 'The order withdrew. The faithful will hear it called a tactical withdrawal.',
                polarity: 'loss' as const,
              },
            ],
            reactionPrompt: 'What does the god keep from the field where the order broke?',
            reactions: [
              {
                id: 'hod.crusade.fail.mark',
                label: 'Mark what {name} saw at the wall — the enemy\'s real strength.',
                intent:
                  'The defeat contained specific knowledge. What {name} saw at the gate before the retreat ' +
                  'is something the order needs before it tries again.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY + 0.1,
                    label: 'Witnessed the repelled assault — knows the enemy\'s true defensive strength at {location}',
                    revealFamilies: ['holy_order', 'investigation'],
                  },
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
                ],
                closeAfterSelection: false,
              },
              {
                id: 'hod.crusade.fail.seed',
                label: 'The cause is not finished. Plant the thread for the next attempt.',
                intent:
                  'The crusade failed at the gates. The work is not done — only deferred. ' +
                  'You plant the thread for the order to follow when it is ready.',
                effects: [
                  {
                    kind: 'encounter_seed' as const,
                    templateId: 'hod.elite.holy_war',
                    delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 3,
                    priority: 1.5,
                    seedLabel: 'The crusade at {location} was repelled. The enemy remains. The order will need a larger answer.',
                    inheritContext: true, // the SAME enemy remains
                  },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.crusade.fail.withdraw',
                label: 'Withdraw. Let the order grieve in the way it knows.',
                intent: 'You withdraw. The order has its rites for defeat. They do not need the god\'s hand in them.',
                effects: [],
                closeAfterSelection: true,
              },
            ],
          },
        },
      },
    },
  },

  {
    id: 'hod.senior.inquisition',
    name: 'Conduct Inquisition',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'star',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['temple', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 3, max: 3 },
        difficulty: HOD_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Dark cults spread in {location} in the way dark cults spread — slowly, then all at once. ' +
          '{name} is given the inquisitor\'s authority and begins the work: the witnesses who will speak, ' +
          'the witnesses who will not, the documents that exist and the ones that do not anymore. ' +
          '{?has_faction}The {faction} order\'s local contacts have names. The names have addresses. ' +
          'The addresses have people who were not expecting visitors.{/has_faction}' +
          '{?no_faction}{name} works the city from the outside in, which is the slower way and the more careful one.{/no_faction}',
        successAfterimage:
          'The cult\'s network is mapped. The leaders identified — names, addresses, affiliations. ' +
          'The rite of accounting is spoken over the list.',
        failureAfterimage:
          'They cover their tracks with practiced ease. Fragments only. The larger pattern will not resolve.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (HOD_SENIOR_BASE + HOD_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.06,
        },
        failureMetadata: { reputationDelta: -0.05 },
        narrativeTemplate:
          'The strike is planned to land simultaneously — the order moves at the same hour across all ' +
          'the addresses on the list, because a cult that has one door kicked down sends a runner to close the others. ' +
          '{name} leads the primary address. ' +
          '{?has_ally}{ally:strongest} takes the secondary. They have the rite of arrest memorized.{/has_ally}' +
          '{?no_ally}{name} alone at the primary. There is no backup for this kind of inquisitor\'s work.{/no_ally}',
        successAfterimage:
          'The cult is broken. Its leaders face judgment. The faithful in {location} will hear about it by morning.',
        failureAfterimage:
          'Many escape. The cult will reform elsewhere — which is what cults do when the hand misses.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The order has given {name} the inquisitor\'s authority and one instruction: ' +
        'find the cult in {location} and break it before it breaks something the order cannot repair.',
      success:
        'The cult is broken. The faith in {location} has one fewer wound.',
      failure:
        'The cult scatters. The rite of a failed inquisition is spoken without witnesses, which is the order\'s mercy.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The inquisition is recorded. The order files it.',
        changes: [],
        reactionPrompt: 'What does the god keep from the inquisition?',
        reactions: [
          {
            id: 'hod.inquisition.default.witness',
            label: 'Bear witness to what the rite uncovered.',
            intent: 'You witness. The work was hard and the light held.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hod.inquisition.default.pass',
            label: 'Pass by. The inquisition stands on its own authority.',
            intent: 'You withdraw. The order has its rites.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
        byOutcome: {
          success: {
            overview:
              'The cult in {location} is broken. What {name} found in the records will outlast the inquisition.',
            changes: [
              {
                id: 'cult_broken',
                kind: 'faction_reputation',
                title: 'The cult is broken.',
                detail: 'The order\'s records note the inquisition and the names taken.',
                polarity: 'positive',
              },
            ],
            reactionPrompt: 'What does the god take from the cult\'s broken network?',
            reactions: [
              {
                id: 'hod.inquisition.success.mark',
                label: 'Keep what {name} found in the documents. The names are useful.',
                intent: 'The cult is broken but its affiliations are not. The knowledge matters.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY + 0.2,
                    label: 'Holds the cult\'s full network map from the inquisition at {location}',
                    revealFamilies: ['investigation', 'holy_order', 'intrigue'],
                  },
                  {
                    kind: 'intelligence' as const,
                    category: 'agent_network',
                    label: 'Cult leadership network from the {location} inquisition',
                    detail: 'Names, addresses, meeting sites — the full hierarchy the inquisition documented. Active affiliates outside {location} remain unaddressed and represent a follow-on threat.',
                    reliability: 0.9,
                  },
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 2 },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.inquisition.success.seed',
                label: 'The affiliates outside {location} are still active.',
                intent: 'You plant the thread for the next inquisitor.',
                effects: [
                  {
                    kind: 'encounter_seed' as const,
                    templateId: 'hod.senior.inquisition',
                    delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 2,
                    priority: 1.4,
                    seedLabel: 'The cult\'s outer network was not addressed in the {location} inquisition.',
                    inheritContext: true, // the SAME cult network
                  },
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
                ],
                closeAfterSelection: true,
              },
            ],
          },
          success_at_cost: {
            overview:
              'The cult in {location} is broken and two of the names taken were not cult at all. '
              + 'They were in the wrong house on the wrong evening and the documents read as though they were not. '
              + 'The order files the inquisition as complete. {name} files it the same way, in the same hand, and knows the difference.',
            changes: [
              {
                id: 'cult_broken_at_cost',
                kind: 'faction_reputation',
                title: 'The cult is broken. Two names were wrong.',
                detail:
                  'The Dawn records an inquisition closed. Two of the taken will not be un-taken by a record.',
                polarity: 'mixed',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
              {
                id: 'inquisition_wrong_names',
                kind: 'future_hook',
                title: 'The wrong names have families.',
                detail: 'People in {location} who were faithful last month are counting who the order took. That count does not stop.',
                polarity: 'loss',
                concepts: [
                  { text: 'the order', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
            ],
            reactionPrompt: 'The rite worked and it took two who were clean. What does the god do with that?',
            reactions: [
              {
                id: 'hod.inquisition.cost.correct',
                label: 'Put the error in front of {name} where it cannot be filed away.',
                intent:
                  'You will not let the second hand smooth this. An inquisitor who can lose two clean names without feeling it '
                  + 'will lose more of them next time.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'soul_diminishment',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                    label: 'Took two clean names in the inquisition at {location} and was not allowed to forget it',
                    revealFamilies: ['holy_order', 'investigation'],
                  },
                  { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
                ],
                closeAfterSelection: false,
              },
              {
                id: 'hod.inquisition.cost.shield',
                label: 'Reach the two families before the order\'s record does.',
                intent:
                  'You get there first. What the order took cannot be given back, but the ones left behind can be found by a hand that is not the order\'s.',
                effects: [
                  { kind: 'reputation_tally' as const, key: 'heart.positive', delta: 2 },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.inquisition.cost.let_close',
                label: 'Let the file close. The cult is broken and that was the work.',
                intent:
                  'You let it stand as written. The rite asked for a network ended, and a network ended.',
                effects: [],
                closeAfterSelection: true,
              },
            ],
          },
          failure: {
            overview:
              'The cult hears the order coming — a day early, which is all it needs. '
              + 'The house at {location} is emptied of everything but furniture by the time {name} reaches it. '
              + 'The rite for a failed inquisition is spoken without witnesses, which is the order\'s mercy.',
            changes: [
              {
                id: 'cult_scattered',
                kind: 'faction_reputation',
                title: 'The cult scattered before the rite.',
                detail: 'The Dawn takes no names. What was in that house is in a dozen houses now.',
                polarity: 'loss',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
            ],
            reactionPrompt: 'The house was empty a day too early. What does the god keep from it?',
          },
        },
      },
    },
  },
];

// ─── Elite Quests ────────────────────────────────────────────────────────

export const HOLY_ORDER_DAWN_ELITE_TEMPLATES: UnifiedActionTemplate[] = [

  {
    id: 'hod.elite.holy_war',
    name: 'Holy War',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 2,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        reach: 'star',
        duration: { min: 3, max: 3 },
        difficulty: HOD_ELITE_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The Grand Master has spoken the declaration at {location}. Holy war — the words the order has not used ' +
          'in a generation — and they carry the full weight of that silence. ' +
          '{name} stands at the front of the assembly and receives the rite of consecrated command. ' +
          '{?has_faction}The {faction} order assembles in full. Even the reluctant ones know what holy war means.{/has_faction}' +
          '{?no_faction}{name} surveys what has answered. It is enough, or it must be.{/no_faction}',
        successAfterimage:
          'The order is united. Divine purpose fills the assembly in a way that does not happen in drills or vigils.',
        failureAfterimage:
          'Dissent runs through the ranks. Not all believe in the cause. {name} can see it in the way they hold their blades.',
      },
      {
        reach: 'iron',
        duration: { min: 3, max: 3 },
        difficulty: (HOD_ELITE_BASE + HOD_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          '{name} leads the vanguard. The first assault is the one the enemy is watching most carefully, ' +
          'because the first assault tells them how the whole campaign will run. ' +
          '{?has_ally}{ally:strongest} holds the flank. They have the rite of battle spoken and are waiting for the signal.{/has_ally}' +
          '{?no_ally}{name} reads the field alone and chooses the moment without counsel.{/no_ally}',
        successAfterimage:
          'The vanguard breaks through. The enemy\'s line has a gap in it now and gaps widen.',
        failureAfterimage:
          'The vanguard is stalled at the wall. The losses mount in silence.',
      },
      {
        reach: 'iron',
        duration: { min: 3, max: 3 },
        difficulty: (HOD_ELITE_BASE + HOD_DIFFICULTY_STEP * 2) / 100,
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
        failureMetadata: {
          reputationDelta: -0.08,
          rewardPool: { categoryWeights: { condition: 1.0 }, tagFilters: ['#wound'] },
        },
        narrativeTemplate:
          'Everything depends on this charge. {name} speaks the rite of final battle — not for the assembled, ' +
          'but under the breath, because the final rite is for the one speaking it. ' +
          '{?has_rival}The enemy\'s commander wears the face of someone {rival:strongest} named in an old compact. ' +
          'That is noted.{/has_rival}' +
          '{?no_rival}There is no name for the enemy here. There is only the charge and what comes after it.{/no_rival}',
        successAfterimage:
          'Victory. The enemy is vanquished and the faith vindicated in the way that only wars can vindicate faith — ' +
          'terribly, and completely.',
        failureAfterimage:
          'Defeat. The order retreats with its wounded and its silence. The rite for a failed holy war is not in the books.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The Grand Master has spoken. Holy war. {name} is given the order\'s full authority and the rite of consecrated command.',
      success:
        'Victory. The enemy of the faith has lost its name and its house.',
      failure:
        'Defeat. The order retreats. The rite of a failed holy war will have to be written by whoever survives to write it.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The holy war is concluded. The order counts its faithful and files the record.',
        changes: [],
        reactionPrompt: 'What does the god press into the hands that carried the order through the war?',
        reactions: [
          {
            id: 'hod.war.witness',
            label: 'Bear witness to what the faith cost.',
            intent: 'You witness without judgment. The war was fought for something real.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hod.war.carry_grief',
            label: 'Carry the names of the fallen. The order should not carry them alone.',
            intent: 'You take the grief that the faithful cannot name. That is what gods are for.',
            effects: [
              { kind: 'recent_event' as const, eventType: 'ripple_consequence',
                message: 'The weight of the fallen in the holy war is carried by the Dawn. {name} walks lighter for it.',
                significance: 0.6 },
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hod.war.pass',
            label: 'Pass by. The order carries its own costs.',
            intent: 'You withdraw. The faithful have always carried the weight of what they believe.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
        byOutcome: {
          success: {
            overview:
              'Victory. The enemy is vanquished and the faith is vindicated in blood and silence. ' +
              '{name} walks the enemy\'s seat of power for the first time and sees what was hidden there.',
            changes: [
              {
                id: 'holy_war_won',
                kind: 'faction_reputation' as const,
                title: 'The holy war was won.',
                detail: 'The order\'s faithful remember who led the charge. That memory has weight.',
                polarity: 'gain' as const,
              },
            ],
            reactionPrompt: 'What does the god press into the hands that won the war?',
            reactions: [
              {
                id: 'hod.war.success.mark',
                label: 'Seal what was found in the enemy\'s stronghold. Some knowledge changes the bearer.',
                intent: 'You mark what {name} witnessed in the enemy\'s seat of power — and the weight it carries.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                    label: 'Knows what was found in the enemy\'s seat of power after the holy war at {location}',
                    revealFamilies: ['holy_order', 'investigation'],
                  },
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 3 },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.war.success.witness',
                label: 'Bear witness to the victory without taking it.',
                intent: 'The faith vindicated itself. {name} carried it. You saw.',
                effects: [
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 2 },
                ],
                closeAfterSelection: true,
              },
            ],
          },
          critical_failure: {
            overview:
              'This is not a retreat. The line does not bend and then hold somewhere behind itself — it opens, '
              + 'and the holy war ends in the field at {location} in an afternoon. '
              + '{name} comes out of it with a banner and no host to carry it. '
              + 'There is no rite for this because the order has never needed one twice.',
            changes: [
              {
                id: 'holy_war_host_broken',
                kind: 'faction_reputation',
                title: 'The host is broken.',
                detail:
                  'The Dawn does not have an army in this region any more. It has survivors, and a road home.',
                polarity: 'loss',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
              {
                id: 'holy_war_faith_shaken',
                kind: 'shell_state',
                title: 'The faithful watched the light lose.',
                detail:
                  'Belief that has seen its own banner go down in open field is a different belief. {name} carries that back with the banner.',
                polarity: 'loss',
                concepts: [
                  { text: 'the banner', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
            ],
            reactionPrompt: 'The host is gone and the banner came home. What does the god do with a faith that lost in the open?',
            reactions: [
              {
                id: 'hod.war.critfail.hold_faith',
                label: 'Hold the belief up while it is falling. It is the only thing left standing.',
                intent:
                  'You take the weight of the field. The order will rebuild a host in a decade; it rebuilds a faith '
                  + 'only if someone holds it through the season after a day like this.',
                effects: [
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 3 },
                  {
                    kind: 'recent_event' as const,
                    eventType: 'ripple_consequence',
                    message: 'The Dawn lost its host at {location} and did not lose its faithful. {name} walked the road home at the front.',
                    significance: 0.9,
                  },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.war.critfail.mark_field',
                label: 'Keep the field exactly as it was. Every part of it.',
                intent:
                  'You hold the whole afternoon where {name} can reach it — the ground, the order of the enemy\'s lines, '
                  + 'the moment the flank went. A defeat carried in full is the only thing a second attempt can be built on.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY + 0.25,
                    label: 'Carries the whole of the day the holy war broke at {location}',
                    revealFamilies: ['holy_order', 'investigation'],
                  },
                  {
                    kind: 'encounter_seed' as const,
                    templateId: 'hod.elite.holy_war',
                    delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 4,
                    priority: 1.8,
                    seedLabel: 'The host broke at {location}. The enemy holds the field and knows the order will come back to it.',
                    inheritContext: true, // the SAME enemy, the same field
                  },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.war.critfail.withdraw',
                label: 'Withdraw. Let the faithful bury this without a god in the room.',
                intent:
                  'You stand away from it. Grief on this scale belongs to the ones who were there, and a god at the graveside would take it from them.',
                effects: [],
                closeAfterSelection: true,
              },
            ],
          },
          failure: {
            overview:
              'Defeat. The order retreats with its wounded and its silence. ' +
              '{name} has seen the enemy\'s true strength now — seen it in the way the line held, in what the defenders did not lose. ' +
              'The rite for a failed holy war is not in the books because no one survived the last one to write it.',
            changes: [
              {
                id: 'holy_war_lost',
                kind: 'faction_reputation' as const,
                title: 'The holy war was lost.',
                detail: 'The order retreated. Whatever happens next is shaped by that retreat.',
                polarity: 'loss' as const,
              },
            ],
            reactionPrompt: 'What does the god press into the hands that survived the defeat?',
            reactions: [
              {
                id: 'hod.war.fail.mark',
                label: 'Witness what {name} now knows about the enemy. That knowledge has a cost.',
                intent: 'You seal what {name} learned about the enemy\'s true strength — the thing that will not stop pressing.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY,
                    label: 'Witnessed the repelled assault — knows the enemy\'s true defensive strength at {location}',
                    revealFamilies: ['holy_order', 'investigation'],
                  },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.war.fail.seed',
                label: 'The enemy remains. Plant the order\'s intent to answer it.',
                intent: 'You press the seed of the next answer into the order\'s hands. The war is not over — only interrupted.',
                effects: [
                  {
                    kind: 'encounter_seed' as const,
                    templateId: 'hod.elite.holy_war',
                    delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS,
                    priority: 2,
                    seedLabel: 'The holy war at {location} was repelled. The enemy remains and the order has not forgotten.',
                    inheritContext: true, // the SAME enemy remains
                  },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.war.fail.withdraw',
                label: 'Withdraw. The faithful carry their costs without the god.',
                intent: 'You step back. The order has always known that some losses must be carried alone.',
                effects: [],
                closeAfterSelection: true,
              },
            ],
          },
        },
      },
    },
  },

  {
    id: 'hod.elite.divine_trial',
    name: 'Divine Trial',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'star',
    crudType: 'create',
    scale: 'local',
    locationSubtypes: ['temple', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'star',
        duration: { min: 2, max: 2 },
        difficulty: HOD_ELITE_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The inner sanctum of the temple at {location} is not a place the order sends people casually. ' +
          '{name} enters on the order\'s authority and their own faith — which is the only currency the sanctum accepts. ' +
          '{?has_artifact}The {artifact:any} goes silent at the threshold. Old things know when to be quiet.{/has_artifact}' +
          '{?no_artifact}There is nothing to carry here. The trial does not allow it.{/no_artifact}',
        successAfterimage:
          'The sanctum accepts {name}. Visions come — not comfortable ones, but the kind the faithful call true.',
        failureAfterimage:
          'The sanctum resists. {name}\'s faith wavers in a way that will be difficult to describe to anyone who wasn\'t there.',
      },
      {
        reach: 'star',
        duration: { min: 2, max: 2 },
        difficulty: (HOD_ELITE_BASE + HOD_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Each knight faces a trial the sanctum constructs for them alone. {name}\'s trial is {their} own and ' +
          'the order does not ask about it after, because the order knows that some of the trial\'s work is done ' +
          'in the keeping of it. ' +
          '{?has_rival}The trial puts a face on its hardest moment that {rival:strongest} would recognize.{/has_rival}' +
          '{?no_rival}The trial makes itself from {name}\'s own memory. That is the traditional way, and the hardest.{/no_rival}',
        successAfterimage:
          'The ordeal is survived. {name} emerges from the deeper part of the sanctum thinner, lighter, and harder.',
        failureAfterimage:
          'The trial breaks something small and load-bearing. Recovery will be slow, and the sanctum will remember.',
      },
      {
        reach: 'star',
        duration: { min: 2, max: 2 },
        difficulty: (HOD_ELITE_BASE + HOD_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.08,
          rewardPool: {
            categoryWeights: { possession: 0.10, condition: 0.30, bestowed_power: 0.60 },
            tagFilters: ['#star'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.06,
          rewardPool: { categoryWeights: { condition: 1.0 } },
        },
        narrativeTemplate:
          'The last chamber is the one the trial has been building toward. {name} stands in it and waits. ' +
          'The light of the Dawn comes — or it does not — and there is no rite for the waiting, only the waiting. ' +
          '{?has_faction}The {faction} order has its records of those who received the mandate and those who didn\'t. ' +
          '{name} knows the list.{/has_faction}' +
          '{?no_faction}There is no list here. There is only the light, or the silence.{/no_faction}',
        successAfterimage:
          'The mandate is received. {name} is chosen among the chosen — ' +
          'which the order says like a blessing and means like a weight.',
        failureAfterimage:
          'Silence. The light does not answer. Not yet. The trial will be available again when the sanctum decides.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} enters the inner sanctum of the temple at {location} for the divine trial. ' +
        'The order does not say what happens inside. The order says only that the trial chooses what it tests.',
      success:
        'The mandate is received. The light of the Dawn has found {name} worthy. ' +
        'The order will not say this out loud for some time, but the record shows it.',
      failure:
        'The light did not answer. The sanctum will not say why. {name} will return when the order decides the time is right.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The divine trial is concluded. The sanctum\'s record is kept.',
        changes: [],
        reactionPrompt: 'What does the god keep from the trial?',
        reactions: [
          {
            id: 'hod.trial.default.witness',
            label: 'Bear witness to what {name} endured.',
            intent: 'You witness. The trial was real and the enduring was real.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hod.trial.default.pass',
            label: 'Pass by. The sanctum does not require the god\'s attention.',
            intent: 'You withdraw. The trial is between the faithful and the Dawn.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
        byOutcome: {
          success: {
            overview:
              '{name} has received the divine mandate. The order\'s record is updated.',
            changes: [
              {
                id: 'mandate_received',
                kind: 'faction_reputation',
                title: 'The mandate is received.',
                detail: 'The order\'s second hand notes the date and the name.',
                polarity: 'positive',
              },
            ],
            reactionPrompt: 'What does the god press into the mandate?',
            reactions: [
              {
                id: 'hod.trial.success.seal',
                label: 'Seal the mandate with a witness-mark.',
                intent: 'You mark the moment. The mandate is real and the witnessing makes it permanent.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY + 0.1,
                    label: 'Carries the mandate of the Dawn received in the inner sanctum',
                    revealFamilies: ['holy_order', 'divine'],
                  },
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 3 },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.trial.success.witness',
                label: 'Bear witness and withdraw. The mandate speaks for itself.',
                intent: 'You witness. The rite is complete. The mandate does not need the god\'s endorsement.',
                effects: [
                  { kind: 'reputation_tally' as const, key: 'star.positive', delta: 2 },
                ],
                closeAfterSelection: true,
              },
            ],
          },
          failure: {
            overview:
              '{name} stands in the inner sanctum at {location} until the order opens the door again, and the light does not answer. '
              + 'Not refusal — silence. The sanctum says nothing at all, which the order has words for and {name} does not.',
            changes: [
              {
                id: 'trial_unanswered',
                kind: 'faction_reputation',
                title: 'The light did not answer.',
                detail: 'The Dawn enters a trial attempted. There is no second line in the record for why.',
                polarity: 'loss',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
            ],
            reactionPrompt: 'The sanctum stayed silent. What does the god do at a door that opened on nothing?',
          },
          critical_failure: {
            overview:
              'The light answers, and what it answers is no. '
              + '{name} comes out of the inner sanctum at {location} before the order expects the door to open, '
              + 'and the ones waiting outside see the face and stop asking. '
              + 'The order will call this a trial deferred. The sanctum was not deferring.',
            changes: [
              {
                id: 'trial_refused',
                kind: 'faction_reputation',
                title: 'The trial refused the one who entered.',
                detail:
                  'The Dawn does not write refusals down. Everyone who stood at that door knows the record is short a line.',
                polarity: 'loss',
                concepts: [
                  { text: 'The Dawn', visualKind: 'faction', visualName: 'Holy Order of the Dawn' },
                ],
              },
              {
                id: 'trial_refusal_carried',
                kind: 'shell_state',
                title: 'The refusal came out with {name}.',
                detail:
                  'A sanctum that speaks once speaks for a long time afterward. Star answered, and the answer stays in the ear.',
                polarity: 'loss',
                concepts: [
                  { text: 'Star', tooltipId: 'reach.star' },
                ],
              },
            ],
            reactionPrompt: 'The Dawn refused its own. Where does the god stand at that door?',
            reactions: [
              {
                id: 'hod.trial.critfail.stand',
                label: 'Stand with the one the sanctum turned away.',
                intent:
                  'You take the side the order cannot take. The Dawn refused {name}; you did not, and {name} will know which of those came first.',
                effects: [
                  { kind: 'reputation_tally' as const, key: 'heart.positive', delta: 3 },
                  {
                    kind: 'recent_event' as const,
                    eventType: 'ripple_consequence',
                    message: 'The sanctum at {location} refused {name}. Something else did not.',
                    significance: 0.8,
                  },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.trial.critfail.mark',
                label: 'Keep what the light actually said. The order will not.',
                intent:
                  'You hold the refusal exactly as it was given, in its own words. A mandate denied for a reason is a reason someone can go and answer.',
                effects: [
                  {
                    kind: 'hidden_mark' as const,
                    category: 'secret_knowledge',
                    severity: FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY + 0.2,
                    label: 'Knows what the sanctum at {location} said when it refused the mandate',
                    revealFamilies: ['holy_order', 'divine', 'investigation'],
                  },
                  {
                    kind: 'encounter_seed' as const,
                    templateId: 'hod.elite.divine_trial',
                    delayTicks: FACTION_PROSE_SEED_DELAY_QUEST_TICKS * 4,
                    priority: 1.4,
                    seedLabel: 'The sanctum at {location} refused {name} for a reason. The reason has not been answered.',
                    inheritContext: true, // the SAME refusal, unanswered
                  },
                ],
                closeAfterSelection: true,
              },
              {
                id: 'hod.trial.critfail.withdraw',
                label: 'Withdraw. The trial is between the faithful and the Dawn.',
                intent: 'You leave the door. Whatever passed in that room was not addressed to you.',
                effects: [],
                closeAfterSelection: true,
              },
            ],
          },
        },
      },
    },
  },
];

// ─── Social Encounters ───────────────────────────────────────────────────

export const HOLY_ORDER_DAWN_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [

  withEncounterContract({
    id: 'hod.social.dawn_prayer',
    name: 'Dawn Prayer',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'star',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['temple', 'town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: (HOD_DIFFICULTY_BASE - 10) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: { categoryWeights: { possession: 1.0 } },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The order gathers at first light, which is when the faithful call the Dawn by name. ' +
          '{name} joins the assembly in the courtyard of the temple at {location} and adds {their} voice to the rite. ' +
          '{?has_faction}The {faction} captain leads this morning\'s prayer. It is a good sign.{/has_faction}' +
          '{?no_faction}The rite is led by a senior squire, which is the order\'s way of practicing continuity.{/no_faction}',
        successAfterimage:
          'Peace settles into the bones. {name} starts the day with a purpose that is quieter than ambition.',
        failureAfterimage:
          '{name}\'s mind is elsewhere. The prayer feels like words in someone else\'s mouth.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The order calls the Dawn by name at first light. {name} is present at {location} when the bell rings.',
      success:
        'The rite is spoken and the day begins.',
      failure:
        'The rite is spoken. {name} was there. That is enough, even when it doesn\'t feel like it.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The dawn prayer is spoken. The order begins its day.',
        changes: [],
        reactionPrompt: 'What does the god keep from the morning rite?',
        reactions: [
          {
            id: 'hod.prayer.witness',
            label: 'Bear witness to the faithful who gathered.',
            intent: 'The small rite has its own weight. You mark it.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hod.prayer.pass',
            label: 'Pass by. The dawn does not require the god in every prayer.',
            intent: 'You withdraw. The faithful do not need to feel the god\'s eye in the morning rite.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'hod.social.blessing_ceremony',
    name: 'Blessing Ceremony',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'star',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['temple', 'town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: (HOD_DIFFICULTY_BASE - 5) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: { categoryWeights: { possession: 0.50, condition: 0.50 } },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'Citizens seek the order\'s blessing in the temple square at {location}. ' +
          '{name} takes the position at the blessing table — the one that makes {them} visible, which is the point — ' +
          'and begins. The words are from the rite of daily witness, which is old and reliable. ' +
          '{?has_faction}The {faction} order\'s presence here is known. The queue is longer than usual.{/has_faction}' +
          '{?no_faction}The citizens do not know {name}. They see the blade and the order\'s insignia and stand in line anyway.{/no_faction}',
        successAfterimage:
          'The faithful leave the square a little steadier. {name}\'s name will be spoken well in the evening.',
        failureAfterimage:
          'The words come out right but nothing behind them moves. The faithful accept the blessing and look like they know.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'The order sends {name} to hold the blessing ceremony at {location}. It is the rite of daily witness made public.',
      success:
        'Blessings given. The square empties. The day at {location} begins a little better than it was.',
      failure:
        'Blessings given. The square empties. The day at {location} continues.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The blessing ceremony is concluded.',
        changes: [],
        reactionPrompt: 'What does the god press into the hands that were blessed?',
        reactions: [
          {
            id: 'hod.blessing.strengthen',
            label: 'Strengthen the blessing a little.',
            intent: 'You add the god\'s weight to the order\'s rite. The faithful will feel it, though they won\'t say how.',
            effects: [
              { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hod.blessing.witness',
            label: 'Bear witness. The rite does not need more than that.',
            intent: 'You witness. The rite is complete.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'hod.social.tend_wounded',
    name: 'Tend the Wounded',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['temple', 'town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: HOD_DIFFICULTY_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
          },
        },
        failureMetadata: { reputationDelta: 0.0 },
        narrativeTemplate:
          'The temple hospice at {location} runs long hours. {name} takes a shift — ' +
          'not the ones that require the senior healers, but the ones that require presence: ' +
          'the wounded who cannot sleep, the ones waiting for a verdict on a limb, the ones who want to talk ' +
          'about what happened to them and know, somehow, that a knight of the order will listen without judging. ' +
          '{?has_ally}{ally:strongest} is already there when {name} arrives, working the far end of the hall.{/has_ally}' +
          '{?no_ally}{name} works the hall alone, which is how most of the hospice\'s shifts are worked.{/no_ally}',
        successAfterimage:
          'Lives eased. The wounded thank {name} with the grateful eyes of people who are still surprised by kindness.',
        failureAfterimage:
          'Some wounds are beyond the skill {name} carries today. {they} do what {they} can, and that has to be enough.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} takes a shift at the temple hospice at {location}. The work is not heroic, ' +
        'which is why the order considers it a rite.',
      success:
        'The shift is done. The wounded are a little easier. The hospice continues.',
      failure:
        'The shift is done. Some wounds are larger than one shift can address. The hospice continues.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The hospice shift is completed.',
        changes: [],
        reactionPrompt: 'What does the god carry away from the hospice?',
        reactions: [
          {
            id: 'hod.hospice.ease',
            label: 'Ease the sleep of the wounded who cannot sleep.',
            intent: 'A small mercy, a specific one. The god can do this.',
            effects: [
              { kind: 'recent_event' as const, eventType: 'ripple_consequence',
                message: 'The wounded at the hospice in {location} slept better after {name}\'s shift. The Dawn was present.',
                significance: 0.2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'hod.hospice.witness',
            label: 'Bear witness to the work.',
            intent: 'You witness. The hospice does not require the god\'s attention, but you give it anyway.',
            effects: [],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Join & Promotion ────────────────────────────────────────────────────

export const HOD_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'hod.join',
  name: 'Take the Oath of Dawn',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  reach: 'star',
  crudType: 'create',
  scale: 'local',
  locationSubtypes: ['temple', 'town', 'city', 'capital'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
  steps: [
    {
      reach: 'star',
      duration: { min: 1, max: 1 },
      difficulty: HOD_JOIN_DIFFICULTY / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: { reputationDelta: 0.0 },
      failureMetadata: { reputationDelta: 0.0 },
      narrativeTemplate:
        'The altar of the Dawn at {location} is older than the temple around it. ' +
        '{name} kneels before it and speaks the oath — not to the order, which is mortal, ' +
        'but to the light, which is not. ' +
        '{?has_faction}Those who have already sworn the oath stand witness, as the rite requires.{/has_faction}' +
        '{?no_faction}No witnesses are required for the taking of the oath. The Dawn witnesses it.{/no_faction}',
      successAfterimage:
        'The light accepts {name}. Squire of the Dawn. The rite is entered in the second hand.',
      failureAfterimage:
        '{name}\'s heart is not ready. The altar does not reject — it only does not answer. ' +
        'Return when the faith is true.',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name} stands before the altar at {location} and prepares to speak the oath of the Dawn. ' +
      'The order does not require much of a squire, at first. Only the oath.',
    success:
      'The oath is spoken and held. {name} is a squire of the Dawn.',
    failure:
      'The oath is not yet ready to be spoken. The order will not close the door.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The oath is spoken. The order receives a new squire.',
      changes: [],
      reactionPrompt: 'What does the god press into the moment of the oath?',
      reactions: [
        {
          id: 'hod.join.bless_oath',
          label: 'Bless the oath. Make it real.',
          intent: 'You mark the moment. The oath is spoken to you, as much as to the order.',
          effects: [
            { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'hod.join.witness',
          label: 'Bear witness. The oath is enough on its own.',
          intent: 'You witness. The oath does not need the god\'s endorsement to be real.',
          effects: [],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const HOD_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'hod.promotion',
  name: 'Rite of Ascension',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'star',
  crudType: 'create',
  scale: 'local',
  locationSubtypes: ['temple', 'town', 'city', 'capital'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
  steps: [
    {
      reach: 'star',
      duration: { min: 2, max: 2 },
      difficulty: HOD_PROMOTION_DIFFICULTY / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        tierPromotionEligible: true,
        reputationDelta: 0.05,
      },
      failureMetadata: { reputationDelta: -0.02 },
      narrativeTemplate:
        'Higher rank demands deeper devotion. The rite of ascension is not given — it is taken, ' +
        'if the trial finds the taker worthy. {name} enters the ascension chamber at {location} and faces ' +
        'what the order calls a trial of faith, which is the order\'s way of not describing what actually happens in there. ' +
        '{?has_faction}The {faction} order\'s senior knights are present as witnesses. They have seen many of these trials.{/has_faction}' +
        '{?no_faction}The witnesses are the altar, the light, and {name}\'s own account of what they believe.{/no_faction}',
      successAfterimage:
        '{name} ascends. The order recognizes the devotion — first in the record, then in how the senior knights speak to {them}.',
      failureAfterimage:
        'The trial reveals doubt. Not a flaw — doubt is how the order checks the work — but this doubt is load-bearing. ' +
        'Meditate and return.',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name} is put forward for the rite of ascension at {location}. ' +
      'The order does not offer this twice before the trial is attempted at least once.',
    success:
      '{name} ascends. The record is updated. The title changes.',
    failure:
      'The trial found the faith unready. The order will speak of it quietly, and {name} will know what that means.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The rite of ascension is concluded.',
      changes: [],
      reactionPrompt: 'What does the god press into the ascension?',
      reactions: [
        {
          id: 'hod.promotion.bless_ascent',
          label: 'Bless the ascension. The devotion was real.',
          intent: 'You mark the moment. The devotion was tested and held.',
          effects: [
            { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'hod.promotion.witness',
          label: 'Bear witness. The rite is complete.',
          intent: 'You witness. The ascension does not need the god\'s hand.',
          effects: [],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const HOD_LIFECYCLE_TEMPLATES: readonly UnifiedActionTemplate[] = [
  HOD_JOIN_TEMPLATE,
  HOD_PROMOTION_TEMPLATE,
];

// ─── Combined export ─────────────────────────────────────────────────────

export const ALL_HOD_TEMPLATES: UnifiedActionTemplate[] = [
  ...HOLY_ORDER_DAWN_ENCOUNTER_TEMPLATES,
  ...HOLY_ORDER_DAWN_SENIOR_TEMPLATES,
  ...HOLY_ORDER_DAWN_ELITE_TEMPLATES,
  ...HOLY_ORDER_DAWN_SOCIAL_TEMPLATES,
  HOD_JOIN_TEMPLATE,
  HOD_PROMOTION_TEMPLATE,
];

// ─── Lookup ──────────────────────────────────────────────────────────────

export function getHolyOrderDawnEncounterById(id: string): UnifiedActionTemplate | undefined {
  return ALL_HOD_TEMPLATES.find(t => t.id === id);
}
