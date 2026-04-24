/**
 * Tavern Encounter Content — 10 tavern-exclusive encounter templates.
 *
 * Migrated to UnifiedActionTemplate (THR-101, Phase 3).
 * Place-bound voice: every opening beat carries at least one of smell / sound /
 * light / crowd. Taverns are information hubs — intelligence grants, hidden
 * marks (overheard secrets, public brawls, promises made), and encounter seeds
 * (rematches, reciprocated favors, recruited companions) are the signature
 * systemic payloads.
 *
 * These templates only fire when the acting agent is at a tavern sublocation
 * (locationSubtypes: ['sublocation-type.tavern']). The filter is load-bearing
 * to the design's place-specificity — do not broaden without updating the
 * socialEncounterGeneration pipeline.
 *
 * Pattern parents: THR-89 (Thieves Guild), THR-100 (Social).
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Edit this file to change tavern encounter templates,
 * step sequences, difficulty curves, and narrative prose.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';

// ─── Tavern Sublocation Filter ────────────────────────────────

const TAVERN_SUBLOCATION = ['sublocation-type.tavern'];

// ─── Difficulty Constants (0–1 normalized) ────────────────────

const TD_EASY = 0.30;
const TD_MOD = 0.45;
const TD_HARD = 0.60;

// ─── 10 Tavern Encounter Templates ────────────────────────────

export const TAVERN_UNIFIED_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [

  // ── 1. Tavern Brawl ────────────────────────────────────────

  {
    id: 'tavern.brawl',
    name: 'Tavern Brawl',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: TAVERN_SUBLOCATION,
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: TD_EASY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.03 },
        failureMetadata: {
          reputationDelta: -0.02,
          onFailureEffects: [
            { kind: 'condition_attachment', templateId: 'trait.condition.wounded' },
          ],
        },
        narrativeTemplate:
          'The common room at {location} is loud enough that {name} hear{s} the insult before {they} see{s} the man who said it — ' +
          'a drover two stools down, ale down his beard, looking for somebody to fight. ' +
          'Conversation drops by a half-step; the hiccup-pause before a room commits to a spectacle. ' +
          '{?has_ally}{ally:strongest} is already shifting {their} weight forward — not to join, but to hold ground if {name} needs someone behind {them}.{/has_ally}' +
          '{?no_ally}No one here has {name}\'s back. The room is audience, not ally.{/no_ally}',
        successAfterimage:
          '{name} plants the first fist before the drover has set his stance. ' +
          'The crowd parts backwards in the way taverns do — nobody runs, nobody steps in. ' +
          'The first blow is an answer. What comes next is whether {name} can keep it that way.',
        failureAfterimage:
          'The drover is faster than he looked. Knuckles across {name}\'s jaw, ale and blood on the floorboards. ' +
          'The room draws its breath all at once. Somewhere behind {name}, a mug breaks.',
      },
      {
        reach: 'flesh',
        duration: { min: 1, max: 1 },
        difficulty: TD_MOD,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.06,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.40, mastery: 0.30 },
            tagFilters: ['#iron', '#flesh'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.04,
          rewardPool: {
            categoryWeights: { condition: 0.90, possession: 0.10 },
            tagFilters: ['#iron'],
          },
          onFailureEffects: [
            { kind: 'condition_attachment', templateId: 'trait.condition.wounded' },
          ],
        },
        narrativeTemplate:
          'Chairs go over. A bottle crosses the air and does not find {name}. ' +
          'This is where a brawl becomes a story — either someone stays standing or the barkeep fetches the wardens. ' +
          '{name} press{es} in close, under the reach of a man who has been fighting for the room, not for himself.',
        successAfterimage:
          'The drover goes down against a table and stays there. {name} straightens, breathing hard, ' +
          'and the crowd roars — not for the blood, for the finality. The barkeep is already waving down the wardens at the door. ' +
          'Tonight, at {location}, they will remember which one was left standing.',
        failureAfterimage:
          '{name} takes a knee too early, and the drover\'s boot does the rest. ' +
          'A barmaid drags {name} out to the alley by the collar, swearing the whole way. ' +
          'Behind the door the room goes back to itself — but the story of the fight will outlast the bruises.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A quarrel has started at {location}. {name} is close enough that walking away costs more than fighting.',
      success:
        'The brawl ends with {name} on {their} feet. The tavern has a new story about the kind of person {they} are.',
      failure:
        '{name} is carried out by a barmaid. The bruises heal. What the room saw does not.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A brawl at {location}. Either way, the room watched — and in taverns, what the room watches carries.',
        changes: [
          {
            id: 'brawl_standing',
            kind: 'reputation',
            title: 'Bar-room Standing',
            detail: 'Winners of tavern brawls earn a specific reputation: useful in some rooms, disqualifying in others.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the room remember about this fight?',
        reactions: [
          {
            id: 'brawl_rematch_seed',
            label: 'The drover swears a rematch. He will come for {name} again.',
            intent:
              'A public loss at {location} is carried heavier than the injury. The drover will be back, sober, with friends.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'tavern.the_challenge',
                delayTicks: 28,
                seedLabel: 'Drover returns to {location} seeking rematch with {name}',
              },
              { kind: 'reputation_tally', key: 'iron.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'brawl_witnessed_victory',
            label: 'The fight happened in public. Everyone who was there saw it.',
            intent:
              'A brawl won in front of witnesses at {location} travels on its own. People will name {name} as somebody to reckon with — or avoid.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'reputation_note',
                severity: 0.3,
                label: 'Bested a man publicly in a brawl at {location}',
                revealFamilies: ['social.investigate_reputation', 'social.intimidate'],
              },
              { kind: 'reputation_tally', key: 'iron.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'brawl_public_loss',
            label: '{name} lost — in front of a full house.',
            intent:
              'A public defeat at {location} is the kind of thing the room retells. The story shapes how {name} is read in future rooms.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'reputation_note',
                severity: 0.35,
                label: 'Beaten publicly in a tavern brawl at {location}',
                revealFamilies: ['social.investigate_reputation', 'social.intimidate'],
              },
              { kind: 'reputation_tally', key: 'iron.negative', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 2. Overheard Rumor ──────────────────────────────────────

  {
    id: 'tavern.overheard_rumor',
    name: 'Overheard Rumor',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: TAVERN_SUBLOCATION,
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: TD_EASY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, bestowed_power: 0.30, condition: 0.20 },
            tagFilters: ['#eye', '#shadow'],
          },
        },
        failureMetadata: { reputationDelta: 0 },
        narrativeTemplate:
          '{name} nurses a cup at the long table in {location} — hearth red on the tin, pipe-smoke thick enough to drag at the lamps, ' +
          'the rolling low register of a room half-drunk. The trick at a tavern is knowing which voice to stop pretending not to hear. ' +
          '{?has_faction}Guild-trained ears pick a clean signal out of the crowd — {name} know{s} the cadence of a man who thinks he isn\'t being listened to.{/has_faction}' +
          '{?no_faction}No one has taught {name} this; {they} ha{s} to learn it from the room itself — which voices pause, which don\'t, which know to be careful.{/no_faction}',
        successAfterimage:
          'A name. A route. A date next week. The two traders at the next bench have been talking for an hour and do not realise ' +
          'they gave away the thing they came here to negotiate in private. {name} let{s} the cup rest on the table and does not write anything down.',
        failureAfterimage:
          'The loudest man at the table is drunk enough to be interesting but not useful — opinions, not observations. ' +
          'Two hours pass. {name} leave{s} with an aching head and nothing worth carrying.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} settle{s} in at {location} to listen. A tavern at the right hour is the cheapest place in the world to learn something that matters.',
      success:
        'Someone said too much within earshot. {name} leave{s} with a specific piece of intelligence.',
      failure:
        'The room\'s noise stayed noise. Nothing usable surfaced tonight.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'An evening of listening at {location}. Taverns leak — the question is only whether the leak is valuable.',
        changes: [
          {
            id: 'rumor_record',
            kind: 'reputation',
            title: 'Overheard Intelligence',
            detail: 'Something said loudly enough at {location} that the wrong person heard it.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'Which thread did {name} pick out of the room\'s noise?',
        reactions: [
          {
            id: 'rumor_intel_trade_route',
            label: 'A shipment — time, route, cargo. Traders forget how the room carries.',
            intent:
              'Two merchants traded particulars at volume. {name} has enough to intercept, invest, or warn.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Overheard at {location}: trader named specific shipment route and date',
                detail:
                  'Two traders discussed a consignment in detail — origin, timing, cargo, and the party receiving. ' +
                  'The detail is dated and specific enough to act on within a cycle.',
                reliability: 0.7,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'rumor_intel_faction_grudge',
            label: 'A faction rift — someone\'s losing standing and doesn\'t know the room has noticed.',
            intent:
              'The tavern talk was about a quiet realignment. {name} now knows a fault-line the parties involved have not yet named.',
            effects: [
              {
                kind: 'intelligence',
                category: 'agent_network',
                label: 'Overheard at {location}: faction member losing internal standing',
                detail:
                  'A member of a local faction is being quietly cut out of decisions. The reasons named at the table are partial, ' +
                  'but the direction is clear — someone is on the way out, and they may not know it yet.',
                reliability: 0.6,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 3. Drinking Contest ────────────────────────────────────

  {
    id: 'tavern.drinking_contest',
    name: 'Drinking Contest',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'flesh',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: TAVERN_SUBLOCATION,
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'flesh',
        duration: { min: 1, max: 1 },
        difficulty: TD_EASY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: 0 },
        narrativeTemplate:
          'A row of cups, a crowd pressed three deep around the table, a smell of spirit strong enough to catch at the throat. ' +
          '{name} take{s} the stool across from the challenger at {location} — a trapper half again {their} size, grinning. ' +
          'The first round goes on the count of the regulars\' stamping feet.',
        successAfterimage:
          '{name} set{s} the first cup down empty and upside-down — the old tavern sign for "come at me." The trapper laughs. The crowd cheers.',
        failureAfterimage:
          'The first cup is sharper than {name} expected. The room tilts by a handspan. The trapper already knows how this ends.',
      },
      {
        reach: 'flesh',
        duration: { min: 1, max: 1 },
        difficulty: TD_MOD,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.06,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.20, mastery: 0.20 },
            tagFilters: ['#flesh', '#heart'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.03,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#flesh'],
          },
          onFailureEffects: [
            { kind: 'condition_attachment', templateId: 'trait.condition.wounded' },
          ],
        },
        narrativeTemplate:
          'By the final round the lamps have doubled and the stamping has gone to a roar. ' +
          'The trapper\'s face has gone the colour of the hearth. {name} lift{s} the last cup and the room waits on {them}.',
        successAfterimage:
          '{name} slam{s} the empty cup down. The trapper slides under the table, still laughing. ' +
          'Coins fly, strangers clap {name}\'s back, and the barkeep pours a round on the house — the kind of victory a tavern remembers in song for a month.',
        failureAfterimage:
          '{name} slide{s} off the stool before the cup reaches {their} mouth. ' +
          'Someone — kind, but laughing — drags {them} to a bench in the corner. In the morning the headache will be the longer part of the bill.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A drinking contest at {location}. {name} agreed to it somewhere between the fourth round and the crowd\'s cheer.',
      success:
        '{name} is still sitting when the challenger isn\'t. The house erupts.',
      failure:
        '{name} folds before the last round. Someone will buy the winner\'s next cup.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A drinking contest at {location}. Both outcomes get retold; the question is who tells the story.',
        changes: [
          {
            id: 'drinking_record',
            kind: 'reputation',
            title: 'Drinking Reputation',
            detail: 'The outcome of a public drinking contest at a named tavern is not kept quiet.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the room say about this contest in the days after?',
        reactions: [
          {
            id: 'drinking_signature_move',
            label: 'The trapper tells everyone. {name} has a reputation now.',
            intent:
              'A public win at {location} becomes local shorthand. {name} will be recognised faster in future rooms.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'reputation_note',
                severity: 0.2,
                label: 'Won a drinking contest at {location} — crowd witnessed',
                revealFamilies: ['social.investigate_reputation'],
              },
              { kind: 'reputation_tally', key: 'flesh.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 4. Bardic Performance ──────────────────────────────────

  {
    id: 'tavern.bardic_performance',
    name: 'Bardic Performance',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: TAVERN_SUBLOCATION,
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TD_EASY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{name} takes the corner stool under the low lamp at {location}. ' +
          'Pipe smoke drifts across the rafters; the clink of cutlery and the slow murmur of the common room are the only accompaniment until {they} tune{s} the first string. ' +
          '{?has_ally}{ally:strongest} is at the nearer table — a friendly face to play toward before the room has decided whether it is listening.{/has_ally}',
        successAfterimage:
          'The first notes settle the tables closest to the hearth. Conversations lower their volume by half. ' +
          'The room has given {name} the only gift it has to offer — attention — and now {they} has to earn keeping it.',
        failureAfterimage:
          'The room does not turn. {name}\'s opening goes under the talk of the nearest table and never surfaces. ' +
          'A tavern\'s cruelty is how quickly it forgets you were there at all.',
      },
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: TD_MOD,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.40, possession: 0.30, bestowed_power: 0.30 },
            tagFilters: ['#heart', '#eye'],
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The final verse is where a tavern-song earns its keep — not the hook, the turn. ' +
          '{name} shift{s} key on the line that matters, and the room holds its breath for the half-beat before the resolution lands.',
        successAfterimage:
          'Silence for the space of two heartbeats. Then the room comes apart — stamping, cheers, coins pitched into the cap at {name}\'s feet. ' +
          'At {location} tonight, {name} has made a friend of the room itself. The story of it will outlast tonight.',
        failureAfterimage:
          '{name} loses the line at the wrong moment — a word mis-placed, the key off by a fraction. ' +
          'The room drifts back to its own conversations, and the rest of the verse plays to a wall that has already moved on.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} has taken the performer\'s stool at {location}. The room has not yet decided whether it is an audience.',
      success:
        'The tavern erupts. {name}\'s name will travel in this region for a season.',
      failure:
        'The song closes to the same noise it opened in. No harm, but no memory either.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A performance at {location}. A tavern that remembers a singer is a rare thing — the question is whether this was one of those nights.',
        changes: [
          {
            id: 'bard_record',
            kind: 'reputation',
            title: 'Performance Record',
            detail: 'What the room felt. What, if anything, it will retell.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'Does the room carry this song out the door?',
        reactions: [
          {
            id: 'bard_seed_return',
            label: 'The house wants {name} back. Word travels to the next town.',
            intent:
              'A tavern that asks a performer to return is the rarest kind of patronage. {name} has an open door at {location} for a long while.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'tavern.bardic_performance',
                delayTicks: 40,
                seedLabel: '{location} calls {name} back to play a second night',
              },
              { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 5. Shady Deal ──────────────────────────────────────────

  {
    id: 'tavern.shady_deal',
    name: 'Shady Deal',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: TAVERN_SUBLOCATION,
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: TD_EASY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The back booth at {location} has a low lamp and an angle on the door. ' +
          'The contact is already seated — hood up, one drink untouched, watching the middle distance. ' +
          '{?has_faction}The guild sign {name} make{s} as {they} slide in is small and old and the contact reads it without appearing to.{/has_faction}' +
          '{?no_faction}Without sign or signal, {name} is working from trust alone — which is to say, from nothing. The contact takes {their} measure over the rim of the cup.{/no_faction}',
        successAfterimage:
          'The contact\'s shoulders drop a finger\'s breadth. The business is on. ' +
          'The booth is close enough that a whisper will carry; the tavern noise at {location} will swallow anything louder.',
        failureAfterimage:
          'The contact holds {name}\'s gaze a second too long, decides something, and stands. ' +
          'The untouched drink is paid for and left behind — a small, deliberate insult. The booth is empty before {name} can speak.',
      },
      // ActionStepBranch: contact trusts you vs needs persuasion
      {
        branchOnStep: 0,
        variants: {
          trust_established: {
            reach: 'shadow',
            duration: { min: 1, max: 1 },
            difficulty: TD_MOD,
            failBehavior: 'fail_action',
            onSuccess: [],
            onFailure: [],
            successMetadata: {
              reputationDelta: 0.06,
              tierPromotionEligible: true,
              rewardPool: {
                categoryWeights: { possession: 0.70, bestowed_power: 0.20, condition: 0.10 },
                tagFilters: ['#shadow', '#gold'],
              },
            },
            failureMetadata: {
              reputationDelta: -0.04,
              rewardPool: {
                categoryWeights: { condition: 0.70, possession: 0.30 },
                tagFilters: ['#shadow'],
              },
            },
            narrativeTemplate:
              'The contact passes the parcel under the table before the second round comes. ' +
              'No inspection, no test — {name}\'s bona fides have done the work. The exchange takes the length of a handshake.',
            successAfterimage:
              'The parcel is folded into {name}\'s coat and the coin into the contact\'s. ' +
              'Both of them know the right thing to do now is to not leave together. {name} waits out a cup before standing.',
            failureAfterimage:
              'The parcel changes hands, but the contact\'s coin was light — short by a tenth, and {name} notices too late. ' +
              'By the time {they} look{s} up, the other half of the booth is empty and the barkeep is studiously cleaning a glass.',
          },
        },
        fallback: {
          reach: 'shadow',
          duration: { min: 1, max: 2 },
          difficulty: TD_MOD + 0.05,
          failBehavior: 'fail_action',
          onSuccess: [],
          onFailure: [],
          successMetadata: {
            reputationDelta: 0.05,
            tierPromotionEligible: true,
            rewardPool: {
              categoryWeights: { possession: 0.60, bestowed_power: 0.20, condition: 0.20 },
              tagFilters: ['#shadow', '#gold'],
            },
          },
          failureMetadata: {
            reputationDelta: -0.05,
            rewardPool: {
              categoryWeights: { condition: 0.70, possession: 0.30 },
              tagFilters: ['#shadow'],
            },
          },
          narrativeTemplate:
            'Without history between them, the contact runs the exchange like a negotiation. ' +
            '{name} open{s} the parcel under the table for a quick look; the contact counts the coin. ' +
            'A thing neither of them wants to do in the open, both of them doing anyway.',
          successAfterimage:
            'The parcel and the coin trade ownership across the knees of two strangers. ' +
            'The business is done; neither party looks at the other as they settle their cups.',
          failureAfterimage:
            'Halfway through the exchange the contact scoops the coin back and stands. ' +
            'The parcel is still {name}\'s, but without payment it is more liability than asset — and the back booth has been used now, which means it has been logged.',
        },
      },
      {
        reach: 'gold',
        duration: { min: 1, max: 1 },
        difficulty: TD_EASY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.03 },
        narrativeTemplate:
          'The clean exit is the part of a tavern deal people forget to plan for. ' +
          '{name} finishe{s} {their} cup at the rate of an ordinary drinker and leaves through the front door, not the back.',
        successAfterimage:
          '{name} step{s} out of {location} into the street and no one follow{s}. ' +
          'By morning the booth will have been used for three more things and nobody will remember which was which.',
        failureAfterimage:
          'A guard at the door gives {name} a long, even look as {they} pass — not suspicion exactly, the kind of cataloguing that pays in the long run. ' +
          'That face will be in someone\'s ledger before dawn.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} has a meeting in the back booth at {location}. The thing being exchanged is not meant to exist on paper.',
      success:
        'The exchange is clean. {name} leaves with what {they} came for, and no name attached.',
      failure:
        'The deal came apart somewhere in its middle. {name} leaves with less than {they} arrived with, and now known to more people.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A shady deal at {location}. Tavern deals leave either a debt, a grudge, or a witness — and sometimes all three.',
        changes: [
          {
            id: 'shady_deal_record',
            kind: 'reputation',
            title: 'Back-Booth Record',
            detail: 'The contact\'s read on {name} now exists somewhere. The door-guard may have filed a face.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What did {name} carry away, and what did {they} leave behind?',
        reactions: [
          {
            id: 'shady_deal_spotted',
            label: 'The guard at the door remembers the face.',
            intent:
              'Exits through the front after a back-booth deal carry a specific cost. {name} is in someone\'s ledger now.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.5,
                label: 'Logged by door-guard at {location} after back-booth meeting',
                revealFamilies: ['social.investigate_reputation', 'social.intimidate'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'shady_deal_contact_open',
            label: 'The contact was satisfied. They\'ll use this channel again.',
            intent:
              'The back booth at {location} is now a reliable meeting place. The contact will route future work through it.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'tavern.shady_deal',
                delayTicks: 24,
                seedLabel: 'Contact returns to {location} with fresh business for {name}',
              },
              { kind: 'reputation_tally', key: 'shadow.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 6. Recruiting Drive ────────────────────────────────────

  {
    id: 'tavern.recruiting_drive',
    name: 'Recruiting Drive',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: TAVERN_SUBLOCATION,
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TD_EASY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.03 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{name} buy{s} a round for the long table at {location} — the old signal, older than any guild. ' +
          'Cups rise; conversation slows; a few eyes hold longer than politeness requires. ' +
          '{?has_faction}The faction\'s colours at {name}\'s shoulder do half the pitch before {they} speak.{/has_faction}' +
          '{?no_faction}Without any colours, {name} is buying interest with coin alone — harder, but honest.{/no_faction}',
        successAfterimage:
          'Heads nod. Cups are raised. At the near end of the table a young shepherd leans forward in the way of someone who has been waiting to be asked. {name} has an audience now.',
        failureAfterimage:
          'The round is drunk. The conversation returns to its own courses. No one looks up. A tavern at {location} tonight wanted ale more than purpose.',
      },
      {
        reach: 'gold',
        duration: { min: 2, max: 2 },
        difficulty: TD_MOD,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.06,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.40, bestowed_power: 0.40, condition: 0.20 },
            tagFilters: ['#heart', '#gold'],
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The shepherd has not looked away for a half-hour. {name} slide{s} into the seat across from {them} and names the terms — ' +
          'what the work is, what it pays, what it costs. The pitch that works in a tavern is the one that does not lie about the cost.',
        successAfterimage:
          'A handshake, and a name given and received. {name} leave{s} the booth with a new companion — the shepherd gathers their pack and leaves the settled life behind with the kind of finality people only manage once.',
        failureAfterimage:
          'The shepherd listens all the way through, nods once, and then says no. Not angry — clear. The stakes were larger than the promise of coin could cover, and {they} know{s} it.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} is recruiting from the common room at {location}. The right buyer of a round can draw out the right follower.',
      success:
        'A new companion has sworn in. A tavern oath is as binding as any.',
      failure:
        'No one took the offer. The round stands, and {name} leaves alone.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A recruitment attempt at {location}. Either {name} has a new shadow or the room turned the offer down.',
        changes: [
          {
            id: 'recruit_record',
            kind: 'reputation',
            title: 'Recruitment Record',
            detail: 'Taverns remember who asks and who agrees. The story of this night will travel either way.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the room make of {name}\'s offer?',
        reactions: [
          {
            id: 'recruit_seed_followup',
            label: 'The new companion will need guidance. The work starts tonight.',
            intent:
              'A follower recruited in a tavern has questions the tavern can\'t answer. {name} owes the first conversation of the rest of it.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'social.forge_alliance',
                delayTicks: 12,
                seedLabel: 'New companion seeks {name} for first orders after {location} recruitment',
              },
              { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'recruit_refused_note',
            label: 'The pitch was turned down — the room noted the terms {name} offered.',
            intent:
              'Recruitment pitches at {location} are heard by more than the person being asked. The terms {name} offered will shape future offers from {name} and from rivals.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'reputation_note',
                severity: 0.15,
                label: 'Recruitment offer declined publicly at {location}; terms noted',
                revealFamilies: ['social.investigate_reputation', 'social.recruit_faction'],
              },
              { kind: 'reputation_tally', key: 'heart.negative', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 7. The Challenge ────────────────────────────────────────

  {
    id: 'tavern.the_challenge',
    name: 'The Challenge',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: TAVERN_SUBLOCATION,
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: TD_EASY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'A voice cuts across the common room at {location} — loud enough that the hearth-side conversations stop mid-sentence. ' +
          '"I hear you\'re supposed to be good." The room breathes in and does not breathe out. ' +
          '{?has_rival}{rival:strongest} is at the far table, watching — this will be told back to them before dawn.{/has_rival}' +
          '{?has_ally}{ally:strongest} catches {name}\'s eye and does not nod, which is {their} way of saying: handle it.{/has_ally}',
        successAfterimage:
          '{name} meet{s} the challenger\'s gaze without blinking, and the crowd reads it as readiness, not arrogance. ' +
          'The challenger nods once. The thing is already half-decided. The tavern makes its ring.',
        failureAfterimage:
          '{name} hold{s} the pause a beat too long — not fear, not quite, but the crowd reads it that way. ' +
          'The challenger smirks. Half of what happens in the next minutes is already priced into the room\'s expectations.',
      },
      // ActionStepBranch: first-blood confidence vs the desperate contest
      {
        branchOnStep: 0,
        variants: {
          answered_clean: {
            reach: 'iron',
            duration: { min: 2, max: 2 },
            difficulty: TD_MOD,
            failBehavior: 'fail_action',
            onSuccess: [],
            onFailure: [],
            successMetadata: {
              reputationDelta: 0.09,
              tierPromotionEligible: true,
              rewardPool: {
                categoryWeights: { mastery: 0.50, possession: 0.30, condition: 0.20 },
                tagFilters: ['#iron'],
              },
            },
            failureMetadata: {
              reputationDelta: -0.05,
              rewardPool: {
                categoryWeights: { condition: 0.60, mastery: 0.40 },
                tagFilters: ['#iron'],
              },
              onFailureEffects: [
                { kind: 'condition_attachment', templateId: 'trait.condition.wounded' },
              ],
            },
            narrativeTemplate:
              'Steel is drawn; the crowd makes its ring of three-deep bodies; the lamps at {location} are bright enough that the blades catch. ' +
              'First blood or first yield. {name} move{s} into the measure of it with the confidence the earlier exchange bought.',
            successAfterimage:
              'Three passes, one clean touch — the challenger\'s cuff parted at the forearm, blood beading, the fight called. ' +
              'Hands extend; {name} takes it. At {location} tonight, a story that will travel all the way to the next town by the post-rider.',
            failureAfterimage:
              'The challenger is better than the posture suggested. A parry slips, a blade finds {name}\'s shoulder, and the room\'s breath goes out of it. ' +
              '{name} yields, sheathing with a steady hand that does not match the cost.',
          },
        },
        fallback: {
          reach: 'iron',
          duration: { min: 2, max: 2 },
          difficulty: TD_HARD,
          failBehavior: 'fail_action',
          onSuccess: [],
          onFailure: [],
          successMetadata: {
            reputationDelta: 0.07,
            tierPromotionEligible: true,
            rewardPool: {
              categoryWeights: { mastery: 0.50, possession: 0.30, condition: 0.20 },
              tagFilters: ['#iron'],
            },
          },
          failureMetadata: {
            reputationDelta: -0.06,
            rewardPool: {
              categoryWeights: { condition: 0.60, mastery: 0.40 },
              tagFilters: ['#iron'],
            },
            onFailureEffects: [
              { kind: 'condition_attachment', templateId: 'trait.condition.wounded' },
            ],
          },
          narrativeTemplate:
            'Having started on the back foot, {name} fights the contest {they} was given, not the one {they} wanted. ' +
            'The challenger presses; the crowd presses closer. Every pass has the stale smell of spilt drink and the coppery weight of blood in the air.',
          successAfterimage:
            'Five passes in, {name} catches the challenger\'s second blade-hand with a turn the crowd did not see coming. ' +
            'The fight is called. A harder win than the first read promised — and the harder win is the one the room will retell.',
          failureAfterimage:
            'A fight won from the back foot is still a fight lost. {name} takes the cut, yields cleanly, and sheathes. ' +
            'The challenger is gracious in victory, which is almost worse than arrogance.',
        },
      },
    ],
    narrativeTemplates: {
      initiation:
        'A challenge has been laid at {location}. Either {name} meets it or {they} leave{s} with the room\'s judgement.',
      success:
        '{name} wins cleanly. Steel has settled what words could not.',
      failure:
        '{name} yields the contest. The cut will heal; the story will not unmake itself.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A formal challenge at {location}. Contests like these are public, and the public remembers.',
        changes: [
          {
            id: 'challenge_record',
            kind: 'reputation',
            title: 'Challenge Record',
            detail: 'A named contest in a named tavern. The result is told in full to travellers who weren\'t there.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What did the room see, and what does it do with what it saw?',
        reactions: [
          {
            id: 'challenge_won_seed_rematch',
            label: 'The challenger will train and return.',
            intent:
              'A challenger beaten cleanly in a tavern contest at {location} will come back — older, cleverer, with a plan.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'tavern.the_challenge',
                delayTicks: 45,
                seedLabel: 'Beaten challenger returns to {location} to seek a second contest with {name}',
              },
              { kind: 'reputation_tally', key: 'iron.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'challenge_witness_mark',
            label: 'Every witness at {location} will retell this fight.',
            intent:
              'A formal contest, witnessed in full, becomes part of a local reputation. {name} will be known — for better or worse — in every tavern within a three-day ride.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'reputation_note',
                severity: 0.4,
                label: 'Formal tavern contest witnessed and retold — {location}',
                revealFamilies: ['social.investigate_reputation', 'social.intimidate'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 8. Confession Over Drinks ──────────────────────────────

  {
    id: 'tavern.confession_over_drinks',
    name: 'Confession Over Drinks',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: TAVERN_SUBLOCATION,
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TD_EASY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.03 },
        failureMetadata: { reputationDelta: 0 },
        narrativeTemplate:
          'A stranger at the far end of the bar at {location} is deep enough into the second bottle that the barkeep has stopped pouring without being asked to. ' +
          'Lamp-yellow light on the wet ring where the glass was. The common-room murmur carries over and past the stranger like a tide they aren\'t in. ' +
          '{name} slide{s} onto the next stool, not close, not far.',
        successAfterimage:
          'The stranger does not look over, but the shoulder nearest {name} drops half an inch — the unspoken permission. ' +
          'The words will come when they come.',
        failureAfterimage:
          'The stranger pulls the cup closer and the shoulder sets. They came here to drink alone and {name} has read them wrong. ' +
          'An apologetic nod, and {name} shifts a stool down.',
      },
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: TD_MOD,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.07,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.50, condition: 0.30, possession: 0.20 },
            tagFilters: ['#heart', '#eye', '#shadow'],
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The first words come slowly. A name. A place. A thing done that shouldn\'t have been. ' +
          '{name} does not ask questions; {they} leave{s} the spaces where the stranger needs to hear {themselves} keep going. ' +
          'The barkeep refills the stranger\'s cup and retreats, because barkeeps at {location} know when a confession is happening.',
        successAfterimage:
          'The story lands — specific, ugly, real. The stranger looks at {name} with the clear-eyed relief of someone who has been carrying a thing alone for a long time. ' +
          'When they stand and leave, they do not thank {name}. They don\'t need to. Both of them know who now holds what.',
        failureAfterimage:
          '{name} ask{s} a question one beat too soon, or {their} face shows something the stranger reads as judgement. ' +
          'The mouth closes; the cup empties; the stranger stands and leaves without looking back. Whatever was coming out tonight will go home with them.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'Someone at the bar at {location} is about to say something they shouldn\'t. {name} has the seat nearest.',
      success:
        'The confession lands. The stranger leaves lighter, and {name} walks out carrying what they gave.',
      failure:
        'The moment passes. The stranger keeps their weight to themselves.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A confession given over drink at {location}. What was said cannot be unsaid; what was heard cannot be unheard.',
        changes: [
          {
            id: 'confession_record',
            kind: 'reputation',
            title: 'Private Knowledge',
            detail: 'A specific thing {name} now knows about a specific person. The knowing is a weight.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'What did the stranger confess, and what does {name} do with the weight of it?',
        reactions: [
          {
            id: 'confession_intel_crime',
            label: 'A specific crime — names, places, evidence that could be brought.',
            intent:
              'The stranger admitted to a concrete deed. {name} now holds actionable knowledge: the thing was done, by whom, where, and the stranger is alive to testify.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Confession at {location}: specific crime with named parties and location',
                detail:
                  'The confessor described a crime in enough detail to matter — the act, the parties, the location, the approximate date. ' +
                  'Evidence trails may exist and could be pursued.',
                reliability: 0.8,
              },
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.4,
                label: 'Listener to a tavern confession — carries knowledge of a named crime',
                revealFamilies: ['social.investigate_reputation', 'social.political_leverage'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'confession_intel_private_shame',
            label: 'A private shame — no crime, but a name to hold and a story.',
            intent:
              'What the stranger gave up was not criminal but human — grief, betrayal, a wrong they carry. The knowledge is less useful but heavier.',
            effects: [
              {
                kind: 'intelligence',
                category: 'agent_network',
                label: 'Confession at {location}: private shame of a named person',
                detail:
                  'The confessor gave up a wound — not a crime, but a name and a story that the subject would not want shared. ' +
                  'Leverage exists in knowing, even if never used.',
                reliability: 0.85,
              },
              {
                kind: 'hidden_mark',
                category: 'reputation_note',
                severity: 0.2,
                label: 'Carries a confession given at {location}',
                revealFamilies: ['social.investigate_reputation'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 9. Merchant's Pitch ────────────────────────────────────

  {
    id: 'tavern.merchants_pitch',
    name: "Merchant's Pitch",
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'gold',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: TAVERN_SUBLOCATION,
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        reach: 'gold',
        duration: { min: 1, max: 1 },
        difficulty: TD_EASY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: 0 },
        narrativeTemplate:
          'A travelling merchant unfolds velvet on the bar at {location} — the small signal that says: this is not for the room, this is for you specifically. ' +
          'Pipe smoke and the low light; the wares catch just enough lamp to suggest without revealing. ' +
          '{?has_faction}The faction sigil at {name}\'s collar earns a second, quieter glance from the merchant — a language spoken before words.{/has_faction}' +
          '{?no_faction}An unaffiliated purse is either a mark or a mystery; {name} can\'t yet tell which the merchant has decided {they} are.{/no_faction}',
        successAfterimage:
          'The merchant\'s pitch is real enough — the wares are what they seem, the prices negotiable. An honest chance to trade.',
        failureAfterimage:
          'A bead has been replaced; a seam is too fresh. The wares are not quite what they pretend to be. ' +
          'The merchant watches {name}\'s face for the moment of recognition.',
      },
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TD_MOD,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, bestowed_power: 0.20, condition: 0.10 },
            tagFilters: ['#gold'],
          },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{name} name{s} a counter at the price of the item minus the cost of the trouble to prove it. ' +
          'The merchant\'s eyes go narrow in the specific way that means they know {name} know{s} — and now the negotiation is real.',
        successAfterimage:
          'The merchant rolls the velvet back up with a small nod, satisfied. A fair price, a fair item, and both parties walked out with their dignity.',
        failureAfterimage:
          'The merchant shrugs, packs the velvet, moves two tables down. Tomorrow the same wares will be offered to someone less careful.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'A travelling merchant has chosen {name} for a quiet pitch at {location}.',
      success:
        'A trade is struck — the merchant is pleased and {name} got what {they} came for.',
      failure:
        'No deal. The merchant takes the next table.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A trade at {location}. Tavern merchants remember names and purses; their network is longer than the road they travelled.',
        changes: [
          {
            id: 'pitch_record',
            kind: 'reputation',
            title: 'Commercial Record',
            detail: '{name}\'s bargaining style is now known to at least one traveller who moves across many towns.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'How does the merchant describe {name} at the next tavern on the road?',
        reactions: [
          {
            id: 'pitch_repeat_customer',
            label: 'The merchant marks {name} down as a serious buyer.',
            intent:
              'A fair trade well-handled earns follow-up. The merchant\'s circuit will route back through {name}\'s area with better goods next season.',
            effects: [
              { kind: 'reputation_tally', key: 'gold.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── 10. The Warning ────────────────────────────────────────

  {
    id: 'tavern.the_warning',
    name: 'The Warning',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: TAVERN_SUBLOCATION,
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: TD_EASY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: 0 },
        narrativeTemplate:
          'Someone has been watching {name} across the common room at {location} for the better part of an hour — ' +
          'not the attention of a room that wants something from {them}, the attention of someone making up {their} mind. ' +
          'The crowd thins after the late bell; the light is down to hearth and a single lamp. Now the watcher rises and crosses.',
        successAfterimage:
          '{name} read{s} it correctly on the first step — not a threat, not a challenge. ' +
          'The watcher slides into the seat opposite and waits to be heard. The thing being brought is a gift of sorts.',
        failureAfterimage:
          '{name} misreads the approach — hand near a hilt, shoulders set. The watcher pauses at the table, reads the tension, and does not sit. ' +
          'Whatever they came to say goes home with them.',
      },
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TD_MOD,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.05,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.50, condition: 0.30, possession: 0.20 },
            tagFilters: ['#eye', '#shadow'],
          },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The watcher speaks quietly, under the bar\'s noise. A name, a date, a specific reason to be careful on the road east. ' +
          'The account is brief and specific enough to be true. ' +
          '{?has_ally}{ally:strongest} would recognise one of the names the watcher used. That alone suggests the warning is not random.{/has_ally}',
        successAfterimage:
          '{name} thank{s} the watcher with the specific care a real gift calls for — no questions, no names asked in return. ' +
          'The watcher leaves by the side door. In a week the warning will have saved {name} something specific.',
        failureAfterimage:
          '{name} shrug{s} the warning off, and the watcher\'s face does not change — the particular politeness of someone who expected this. ' +
          'They stand, finish their drink, and leave. In a week, the thing they warned of will happen anyway.',
      },
    ],
    narrativeTemplates: {
      initiation:
        'Someone at {location} has something to tell {name} — a warning, not a challenge. Whether {name} receives it well is the question.',
      success:
        'The warning is received in the spirit it was given. A debt of a kind has been placed in {name}\'s ledger.',
      failure:
        '{name} brushes the warning off. The watcher leaves. The road ahead does not change for them.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A warning given at {location}. Gifts of information create specific kinds of obligations, whether accepted or not.',
        changes: [
          {
            id: 'warning_record',
            kind: 'reputation',
            title: 'Warning Record',
            detail: 'Information traded across a tavern table leaves a mark in both directions.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'What does {name} do with what the watcher told {them}?',
        reactions: [
          {
            id: 'warning_intel_route_danger',
            label: 'A specific danger on a specific road — names, place, timeframe.',
            intent:
              'The warning was concrete: a route, a party of bad actors, a week. {name} can plan around it or arrive prepared.',
            effects: [
              {
                kind: 'intelligence',
                category: 'military_position',
                label: 'Tavern warning at {location}: named threat on a specific route',
                detail:
                  'A watcher at the tavern named a party or force operating on a specific road. Detail level allows routing or counter-preparation. ' +
                  'Reliability depends on whether other intelligence corroborates.',
                reliability: 0.7,
              },
              {
                kind: 'hidden_mark',
                category: 'favor_owed',
                severity: 0.2,
                label: 'Accepted a warning at {location} — owes the watcher a reciprocal courtesy',
                revealFamilies: ['social.forge_alliance', 'social.persuade'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'warning_seed_return',
            label: 'The watcher will find {name} again when it matters most.',
            intent:
              'Warnings given in taverns are rarely one-way. The watcher has made a specific investment in {name} and will call on it eventually.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'social.forge_alliance',
                delayTicks: 36,
                seedLabel: 'Watcher from {location} seeks {name} to call in the quiet favor',
              },
              { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

];
