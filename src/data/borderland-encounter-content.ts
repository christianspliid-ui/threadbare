/**
 * Borderland Encounter Content — Phase 4 migration to UnifiedActionTemplate (THR-107).
 *
 * Twenty templates covering bandits, outlaws, wild beasts, scavengers, and
 * minor supernatural threats found in borderland terrain: wilderness, camps,
 * ruins, farmland, and frontier settlements.
 *
 * Designed for beginner agents (capability ~0.05–0.25) — the player's first
 * taste of the world. Voice is plain, observational, low-fantasy. No bardic
 * elevation. Mud, weather, hunger, fear — sensory and concrete.
 *
 * Systemic affinity for borderland content:
 *   • Encounter seeds — outsized payoff here, where reputation and
 *     relationships first crystallize (a spared deserter returns as
 *     informant; a wolf pack driven off returns to the same hex; a
 *     smuggler's stash discovered opens an underworld contact line)
 *   • Hidden marks — witnessed mercy, witnessed cruelty (these are the
 *     formative encounters where a fledgling agent's reputation begins
 *     setting in stone)
 *   • {location} placeholders heavily — borderland is placed; specific
 *     hexes color the prose
 *   • {?has_ally} conditionals — traveling alone vs. with company
 *     changes every one of these encounters
 *
 * Registration: spread into UNIFIED_ACTION_TEMPLATES via
 * unified-action-templates.ts. Lookup function getBorderlandEncounterById
 * preserved for backward-compat with encounter-content.ts fallback chain.
 *
 * NFP #1: All difficulty values are named constants (Tunability).
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';

// ─── Tunable Constants ──────────────────────────────────────────────────────

/** Difficulty base for trivial borderland encounters (fresh agents, capability ~0.05). */
const TRIVIAL_DIFFICULTY_BASE = 0.05;

/** Difficulty step per stage in trivial encounters. */
const TRIVIAL_DIFFICULTY_STEP = 0.05;

/** Difficulty base for easy borderland encounters (early-career, capability ~0.12). */
const EASY_DIFFICULTY_BASE = 0.12;

/** Difficulty step per stage in easy encounters. */
const EASY_DIFFICULTY_STEP = 0.06;

// ─── Templates ──────────────────────────────────────────────────────────────

export const BORDERLAND_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  //  BANDITS & OUTLAWS (7 templates)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── borderland.roadside_shakedown ──────────────────────────────────────────
  {
    id: 'borderland.roadside_shakedown',
    name: 'Roadside Shakedown',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'camp', 'farmland'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The road through {location} narrows where the alders crowd in, and that is where the figure steps out — ' +
          'a man more rope than muscle, a knife that has been sharpened more often than it has been used. ' +
          '"Coin or blood." The voice tries for menace and lands on tired. ' +
          '{?has_ally}{ally:strongest} is somewhere behind on the road, and the bandit does not know that yet.{/has_ally}' +
          '{?no_ally}No witness on either side of the alders. Whatever happens here, only one version of it will be told.{/no_ally}',
        successAfterimage:
          '{name} reads the man\'s footing — the back foot already turned for flight — and lets {their} hand rest on hilt without drawing. ' +
          'That is enough.',
        failureAfterimage:
          'The knife comes faster than {name} expected. Hunger is its own training.',
      },
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#combat'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.03,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The bandit bolts into the underbrush — alder slaps, brambles tear, an animal panic. ' +
          '{name} can let {them} go, or finish what the road started. ' +
          'In the {location} brush, both choices weigh roughly the same.',
        successAfterimage:
          '{name} catches up where the brush thins. The man drops a small purse without being asked. ' +
          'Whatever else he meant to be today, he will not be it.',
        failureAfterimage:
          'The alders close behind {them} and the trail goes cold inside fifty paces. ' +
          'Roads have a way of remembering who walked away with what.',
      },
    ],
    narrativeTemplates: {
      initiation: 'A lone bandit blocks the road through {location}, knife drawn, voice shaking.',
      success: 'The bandit is gone — running or dropped. The road is quieter for it.',
      failure: 'The bandit slipped into the brush with what {they} took. The road remembers.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A small road encounter at {location} — the kind that does not survive in any chronicle, ' +
          'but builds, in private, the texture of a reputation.',
        changes: [
          {
            id: 'shakedown_outcome',
            kind: 'reputation_tally',
            title: 'Road Conduct',
            detail: 'How {name} handles the small encounters writes the larger ones in advance.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from this small road?',
        reactions: [
          {
            id: 'shakedown_road_warden_tally',
            label: 'A road kept clean is a road remembered.',
            intent:
              'Travelers compare notes at every wayhouse. One bandit driven off becomes the kind of small fact ' +
              'that follows {name} along the routes that connect {location} to anywhere else.',
            effects: [
              {
                kind: 'reputation_tally',
                key: 'roads_kept_clean',
                delta: 1,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── borderland.bandit_scouts ───────────────────────────────────────────────
  {
    id: 'borderland.bandit_scouts',
    name: 'Bandit Scouts',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'camp', 'ruins'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A glint in the tree-line above {location} — wrong angle for sun on leaf, wrong colour for bird. ' +
          'A cough stifled too late, and behind that cough a second one, less practiced. Two of them. ' +
          'Scouts, by the way they are spaced — one for sightline, one for runner. ' +
          '{?has_ally}{ally:strongest} would catch this in a second. {name} catches it in three, which is also enough.{/has_ally}' +
          '{?no_ally}No one to confirm. Just instinct, the kind that hardens into knowledge if {name} lives long enough to use it again.{/no_ally}',
        successAfterimage:
          '{name} finds them both before they find {them}. The advantage is not large, but advantage is rarely large at this distance.',
        failureAfterimage:
          'A whistle cuts through the trees — one short, one long. Whatever was going to happen now happens faster.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#combat'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'Two against one, and they are not fighters — they are couriers of bad news, paid to count and run. ' +
          'The trick is to stop the runner without spending too much on the watcher. ' +
          '{?has_artifact}The weight of {artifact:weapon} settles into {name}\'s grip the way it has settled before.{/has_artifact}' +
          '{?no_artifact}{name} works with what {they} carry — a blade and the kind of patience that comes from being outnumbered before.{/no_artifact}',
        successAfterimage:
          'The runner drops {their} pack and goes; the watcher is slower, and stays. ' +
          'Whoever sent them will hear about this stretch of road from one mouth, not two.',
        failureAfterimage:
          'The scouts disengage on their own terms — they have what they came for, which was a face. ' +
          '{name} has been seen, and the seeing has been carried back somewhere with walls.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} catches movement in the tree-line near {location}. Bandit scouts, two of them.',
      success: 'The scouts will not report back. The road remains dark to them.',
      failure: 'The scouts withdrew with a face committed to memory. {name} is on a list now.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Scouts at {location} — what they saw or did not see decides the next twenty miles of road.',
        changes: [
          {
            id: 'scouts_outcome',
            kind: 'reputation_tally',
            title: 'Watched',
            detail: 'Eyes have been on {name}, friendly or otherwise. The road keeps a different ledger now.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the watching?',
        reactions: [
          {
            id: 'scouts_marked_by_band',
            label: 'A face has been carried home.',
            intent:
              'Failure here is not the end — it is the beginning of a different kind of trouble. ' +
              'A bandit captain somewhere now knows what {name} looks like, and trouble of that shape returns when convenient.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: 0.35,
                label: 'A bandit band near {location} has carried {name}\'s face home',
                revealFamilies: ['borderland', 'tavern', 'court'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── borderland.toll_bridge_bully ───────────────────────────────────────────
  {
    id: 'borderland.toll_bridge_bully',
    name: 'Toll Bridge Bully',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'heart',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'farmland', 'hamlet'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ['courage_prudence', 'honesty_cunning'],
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The crossing at {location} is a low stone span, mossed at the edges, no railing. ' +
          'The man on it is heavyset and idle, the kind of idle that is its own work. ' +
          'No badge, no chain of office. Just a thick hand on a thicker stick. "Coin for the crossing." ' +
          '{?has_faction}The badge under {name}\'s coat has weight he does not know about. ' +
          'The conversation that is about to happen is not the one he is rehearsing.{/has_faction}' +
          '{?no_faction}No authority but {name}\'s own. The bridge is short. The drop is not.{/no_faction}',
        successAfterimage:
          '{name} holds eye contact past the moment that would have ended a bluff. ' +
          'The man finds something else to look at — the river, mostly. The toll is forgotten.',
        failureAfterimage:
          'A coin changes hands, galling and small. The road ahead is long, and being right is not the same as being across.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#combat'],
          },
          reputationDelta: 0.02,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The bully swings — a slow, broad haymaker that smells of last night\'s ale before it lands. ' +
          'On a stone bridge with no railing, the question is geometry, not strength.',
        successAfterimage:
          'The man goes off-balance and finds water under him where stone used to be. ' +
          'He floats up downstream, sputtering. The crossing is open and the toll is gone.',
        failureAfterimage:
          'The blow connects worse than expected. {name} retreats off the bridge and crosses at the ford ' +
          'a half-mile north, boots wet, dignity wetter.',
      },
    ],
    narrativeTemplates: {
      initiation: 'A bully demands toll at the {location} crossing. No badge, just bulk.',
      success: 'The crossing is free. The bully will choose another bridge.',
      failure: '{name} took the long way around. The toll won, this time.',
    },
  },

  // ── borderland.outlaw_camp ─────────────────────────────────────────────────
  {
    id: 'borderland.outlaw_camp',
    name: 'Outlaw Camp',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'camp', 'ruins'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ['honesty_cunning', 'courage_prudence'],
    steps: [
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Smoke threads up from a hollow below the ridge — not the steady smoke of a hearth, ' +
          'but the broken smoke of a fire that keeps being relit. Three figures at most, by the voices, ' +
          'and the voices are the wrong kind of relaxed. {name} works closer through the ferns of {location}. ' +
          '{?has_ally}{ally:strongest} would have brought a second pair of eyes. ' +
          'Without them, {name} has to be both watcher and witness.{/has_ally}',
        successAfterimage:
          'Sentries marked, escape routes mapped, watch rotations counted. ' +
          'The camp is what it looks like — small, tired, and arranged for comfort, not defense.',
        failureAfterimage:
          'A branch snaps under {name}\'s heel. The camp goes quiet in the wrong way — ' +
          'not alarmed, listening. There is no surprise left to spend.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.30 },
            tagFilters: ['#combat'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.05,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'Three at the fire, weapons within arm-reach, none in hand. ' +
          'There is a window of seconds before that arithmetic changes. ' +
          '{?has_artifact}{name} closes the gap with {artifact:weapon} already moving — ' +
          'a habit older than the word for what {they} are doing.{/has_artifact}' +
          '{?no_artifact}{name} commits with what {they} brought, trusting speed where steel is thin.{/no_artifact}',
        successAfterimage:
          'Two flee through the brush; one does not. The camp is {name}\'s for as long as {they} care to look, ' +
          'and the looking will turn up things the outlaws meant to keep buried.',
        failureAfterimage:
          'The third one came from behind a tree {name} did not check. ' +
          '{name} withdraws bleeding, and the camp moves before sundown to a hollow {they} will not find again.',
      },
    ],
    narrativeTemplates: {
      initiation: 'An outlaw camp hides in the hollows below {location}. {name} closes carefully.',
      success: 'The camp is broken. Whatever was buried there is open to the sky.',
      failure: 'The outlaws scattered with their plans intact. The hollow is empty by morning.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A camp at {location} — taken or missed — is a node in a network of small criminal habits. ' +
          'What gets pulled up here decides whether the network notices.',
        changes: [
          {
            id: 'outlaw_camp_outcome',
            kind: 'reputation_tally',
            title: 'Camp Cleared',
            detail: 'Outlaws have been moved against. The borderland counts these things in the long run.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god draw from the broken camp?',
        reactions: [
          {
            id: 'outlaw_camp_intel',
            label: 'The camp left papers, of a kind.',
            intent:
              'Outlaws keep crude records — names of buyers, marked routes, a tally of debts. ' +
              '{name} reads what {they} can in the firelight before riding on.',
            effects: [
              {
                kind: 'intelligence',
                category: 'agent_network',
                label: 'Names from a borderland outlaw camp',
                detail:
                  'A short list of fences, two settlements that pay for stolen grain, ' +
                  'and the mark of a captain who runs a larger band one valley over.',
                reliability: 0.6,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── borderland.desperate_deserter ──────────────────────────────────────────
  {
    id: 'borderland.desperate_deserter',
    name: 'Desperate Deserter',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'heart',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'farmland', 'camp', 'ruins'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ['mercy_ruthlessness', 'courage_prudence'],
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The figure that lunges out of the ditch wears a soldier\'s coat with the unit-stripe cut off, ' +
          'a knife held the wrong way around, and a smell that is mostly hunger. ' +
          'A boy by the voice, though the eyes have already aged out of being one. ' +
          '{?has_ally}{ally:strongest} would say something about how thin he is. ' +
          'Alone, {name} just notices.{/has_ally}' +
          '{?no_ally}There is no one else on this stretch of {location} road. Whatever happens between them happens in private.{/no_ally}',
        successAfterimage:
          'A wrist-twist, a step, and the knife is in the dirt. The boy goes down on his knees ' +
          'with a noise that is half-fight, half-relief at not having to fight any more.',
        failureAfterimage:
          'Hunger gives him an edge {name} did not budget for. A shallow cut burns along {their} forearm ' +
          'before the knife clatters loose.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#combat'],
          },
          reputationDelta: 0.03,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The deserter kneels in the road, weapon dropped. Starving, terrified, alive. ' +
          'There is no patrol within a day\'s ride and no witness to what {name} decides next. ' +
          'Mercy and ruthlessness both have their arguments, and on this road, both arguments are short.',
        successAfterimage:
          'However {name} resolves it, the boy walks (or doesn\'t walk) away from this hour. ' +
          'The road is what {name} leaves behind, not what {they} started with.',
        failureAfterimage:
          'The boy bolts while {name} hesitates, ditch-grass parting around him. ' +
          'Whatever he becomes after this hour, he becomes elsewhere.',
      },
    ],
    narrativeTemplates: {
      initiation: 'A deserter lunges out of the {location} ditch, knife and hunger and not much else.',
      success: 'The boy is handled. Whatever choice {name} made, the road remembers.',
      failure: 'The deserter ran. The next traveler will deal with whatever he becomes.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A starving boy on the {location} road met {name} and either lived or didn\'t. ' +
          'These are the kinds of small choices the borderland writes a person from.',
        changes: [
          {
            id: 'deserter_outcome',
            kind: 'reputation_tally',
            title: 'Mercy Ledger',
            detail: 'How {name} handled a kneeling boy is a fact that wants to travel.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the ditch?',
        reactions: [
          {
            id: 'deserter_spared_returns',
            label: 'The boy lived. He will remember.',
            intent:
              'Mercy on a back road is rare enough to be a debt. The boy carries that debt out of the ditch ' +
              'and into wherever desertion takes him next — and debts of that shape come back, ' +
              'usually with information attached.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'tavern',
                delayTicks: 30,
                priority: 0.85,
                seedLabel: 'A spared deserter has surfaced near {name}, with news worth hearing',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'deserter_witnessed_cruelty',
            label: 'The road kept a quieter version.',
            intent:
              'Some things are watched even when no human watches. ' +
              'A boy on his knees and a verdict pronounced — the borderland files that under a heading ' +
              '{name} will not pick the title of.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: 0.45,
                label: 'How {name} handled the kneeling deserter on the {location} road',
                revealFamilies: ['borderland', 'tavern', 'court', 'investigation'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── borderland.caravan_thieves ─────────────────────────────────────────────
  {
    id: 'borderland.caravan_thieves',
    name: 'Caravan Thieves',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'farmland', 'hamlet'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Shouting up the road from {location} — one voice indignant, two voices laughing the way ' +
          'thieves laugh when they have the time to. A merchant\'s wagon canted in the ditch, ' +
          'the off-side wheel still spinning. Two men at the cargo, neither hurrying enough. ' +
          '{?has_ally}{ally:strongest} would already be moving. ' +
          '{name} is moving by the time the thought finishes.{/has_ally}',
        successAfterimage:
          '{name} reads the picture in one breath — the merchant pinned under the canted wagon, ' +
          'the thieves with their backs to the road, a sword leaning against a wheel-spoke. ' +
          'There is a clean way through this, and {name} sees it.',
        failureAfterimage:
          'By the time {name} is close enough to commit, the heaviest crate is already on a thief\'s shoulder ' +
          'and the rest is bleeding into the brush.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#combat'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.05,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'The thieves draw short blades — they would rather fight for the haul than run empty-handed, ' +
          'which is the calculation of men who answer to someone unforgiving. ' +
          '{?has_artifact}The first arc of {artifact:weapon} ends one of those calculations.{/has_artifact}' +
          '{?no_artifact}{name} works close, where short blades cancel each other and footing decides everything.{/no_artifact}',
        successAfterimage:
          'Both thieves are gone — one running, one not. The merchant levers himself out from under the wagon ' +
          'and gives {name} a name worth remembering, said twice for emphasis.',
        failureAfterimage:
          'The thieves disengage with half the cargo. The merchant looks at {name} the way men look at a kindness ' +
          'that did not arrive in time, which is a worse look than gratitude.',
      },
    ],
    narrativeTemplates: {
      initiation: 'A merchant\'s wagon is in the ditch outside {location}, and two thieves are not in a hurry.',
      success: 'The thieves are gone, the cargo mostly intact. The merchant remembers {name}.',
      failure: 'The thieves left with half. The merchant remembers that, too, in a different file.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A small mercantile encounter on the {location} road — the kind that, on its own, decides nothing, ' +
          'but in aggregate decides which merchants name {name} in their letters home.',
        changes: [
          {
            id: 'caravan_outcome',
            kind: 'reputation_tally',
            title: 'Merchant Word',
            detail: 'Word of how {name} handled this travels along whichever trade-route the wagon was bound for.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god draw from the rescue?',
        reactions: [
          {
            id: 'caravan_grateful_merchant',
            label: 'The merchant will remember the face.',
            intent:
              'A name said twice, in earnest, on a borderland road, is a contact that will pay forward. ' +
              'The merchant\'s house is small, but it talks to other small houses, and small houses ' +
              'are how a reputation begins.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'tavern',
                delayTicks: 22,
                priority: 0.7,
                seedLabel: 'A merchant {name} helped near {location} has work to offer',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── borderland.smugglers_stash ─────────────────────────────────────────────
  {
    id: 'borderland.smugglers_stash',
    name: 'Smuggler\'s Stash',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['ruins', 'camp', 'wilderness'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ['honesty_cunning', 'asceticism_extravagance'],
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Boot-prints in the soft earth at {location} — fresh, plural, and disciplined enough that ' +
          'the men who made them were not in a hurry. They lead behind a collapsed wall ' +
          'where no traveler would have business. {name} has business now. ' +
          '{?has_ally}If {ally:strongest} were here, this would be a two-person job. Alone, it is a faster one.{/has_ally}' +
          '{?no_ally}No second pair of eyes. {name} has to be {their} own lookout and {their} own thief.{/no_ally}',
        successAfterimage:
          'Behind the rubble, three crates marked with a merchant-house seal that does not match any merchant-house. ' +
          'False stamping, careful work. Whoever made these knew they would be inspected by people who do not know what to look for.',
        failureAfterimage:
          'The cache is better hidden than expected — only a few loose items behind a stone {name} pries up. ' +
          'The bulk of it is somewhere {name} did not think to check.',
      },
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.80, condition: 0.20 },
            tagFilters: ['#shadow'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#shadow'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'Footsteps approaching — three men, talking low, not yet alarmed. ' +
          'They will be at the wall in under a minute, and the next minute decides whether {name} ' +
          'leaves with proof or leaves at all.',
        successAfterimage:
          '{name} slips out the back angle of the rubble with a sample and the seal-stamp itself. ' +
          'The smugglers find the cache compromised but not emptied — the missing pieces are the ones ' +
          'that would tell anyone with eyes what business this is.',
        failureAfterimage:
          'A boot scrapes at the wrong moment. The smugglers see {name} from the wall-line and shout, ' +
          'and shouting carries in a place this empty.',
      },
    ],
    narrativeTemplates: {
      initiation: 'Boot-prints behind a collapsed wall at {location}. Someone has been hiding work here.',
      success: 'The cache is breached, the seal-stamp taken. The smugglers will know they were seen.',
      failure: 'The smugglers caught the trespass. The cache will move, and {name} will move faster.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A smuggler\'s cache at {location} is a thread in a longer rope — pulled, the rest of the rope ' +
          'feels the tug. Someone, somewhere, is now considering {name}.',
        changes: [
          {
            id: 'stash_outcome',
            kind: 'reputation_tally',
            title: 'Underworld Notice',
            detail: 'Word of the breach is a slow signal, but it is now in the air.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god draw from the cache?',
        reactions: [
          {
            id: 'stash_underworld_contact',
            label: 'The seal-stamp opens a door.',
            intent:
              'A false merchant-stamp, traced by the right person, leads to the people who use it. ' +
              'That is not always a comfortable door, but it is a door that opens — ' +
              'and the underworld trades in nothing as readily as in introductions.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'tavern',
                delayTicks: 28,
                priority: 0.95,
                seedLabel: 'The seal-stamp from the {location} cache has bought {name} an introduction',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  WILD BEASTS & NATURAL THREATS (6 templates)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── borderland.feral_dogs ──────────────────────────────────────────────────
  {
    id: 'borderland.feral_dogs',
    name: 'Feral Dog Pack',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'farmland', 'ruins', 'ruined_village'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Growling from three sides at once — the kind of growling that has been planned, in the way a pack plans. ' +
          'Four of them, gaunt, ribs visible. They have eaten worse than {name} and recently.',
        successAfterimage:
          '{name} stamps forward instead of back. The pack-leader, half a step ahead of the rest, flinches — ' +
          'and the flinch travels backward through the others the way fear travels through pack.',
        failureAfterimage:
          'A small dog from the flank darts in and snaps at {name}\'s calf, then is gone before the foot lands. ' +
          'It was a test. The pack now knows {name} flinches.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#beast'],
          },
          reputationDelta: 0.02,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The pack regroups, emboldened. {name} has seconds to convince the leader that this prey costs more than the meal is worth.',
        successAfterimage:
          'A stone, well-thrown, takes the leader on the shoulder. The pack scatters into the brush of {location}, ' +
          'hunger held over for a softer night.',
        failureAfterimage:
          'The pack circles once more before drifting off — not driven, just bored. ' +
          '{name} passes through bitten and wary, and the road feels longer.',
      },
    ],
    narrativeTemplates: {
      initiation: 'A pack of feral dogs has cornered {name} on the {location} track.',
      success: 'The pack scattered. The road is clear.',
      failure: 'The dogs lost interest before {name} did. Either way, {they} {are} bitten and walking.',
    },
  },

  // ── borderland.territorial_boar ────────────────────────────────────────────
  {
    id: 'borderland.territorial_boar',
    name: 'Territorial Boar',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'farmland'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The undergrowth detonates. A boar — not a young one, the tusks scarred halfway to the lip ' +
          'from old fights it survived — comes straight at {name}, head down, breath audible. ' +
          'In {location}\'s thicker ground there is nowhere to climb and nowhere to hide. ' +
          '{?has_artifact}The set of {artifact:weapon} braces against {name}\'s hip in the second before contact.{/has_artifact}',
        successAfterimage:
          '{name} steps off the line at the last possible breath. The boar plows past into a thicket ' +
          'and the thicket complains for a long second before settling.',
        failureAfterimage:
          'A tusk catches {name}\'s thigh — not a death blow, but the kind of glance that prints a scar ' +
          'before {name} has a name for it.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#beast'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#beast'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'The boar wheels in the thicket, snorting, pawing earth. It is deciding whether {name} is worth a second pass. ' +
          'Boars decide by smell more than sight, and the smell of {name} is currently winning the argument.',
        successAfterimage:
          'The boar holds {name}\'s gaze long enough to call it a draw, then withdraws into the trees ' +
          'with a final snort that means "this place is still mine."',
        failureAfterimage:
          'The second charge comes before {name} is set. {name} scrambles up a sapling that flexes alarmingly ' +
          'and waits there until the boar loses interest, which takes longer than dignity prefers.',
      },
    ],
    narrativeTemplates: {
      initiation: 'A territorial boar charges {name} in the {location} undergrowth.',
      success: 'The boar withdrew. The territory is shared, for now.',
      failure: '{name} climbed. The boar won the ground, this time.',
    },
  },

  // ── borderland.venomous_serpent ────────────────────────────────────────────
  {
    id: 'borderland.venomous_serpent',
    name: 'Venomous Serpent',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'eye',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'ruins', 'camp'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A dry rattle from the rocks beside the {location} trail. Not wind, not stone settling — ' +
          'something coiled and waiting where {name}\'s next step would land.',
        successAfterimage:
          '{name} freezes mid-stride. The serpent is right there, hood half-flared, the head no bigger than a fist. ' +
          'Seen, just in time.',
        failureAfterimage:
          'Too late. The strike is fast and accurate; the boot leather is thicker than the fang is patient. ' +
          'A close thing, with no second chances built in.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#beast'],
          },
          reputationDelta: 0.02,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The serpent rears, hood flared. There is a small moment when both {name} and the snake are doing ' +
          'the same arithmetic, in different units.',
        successAfterimage:
          'A swift, economical strike. The serpent does not have time to be anywhere else. ' +
          '{name} moves on, one small danger crossed off the path.',
        failureAfterimage:
          'The snake slithers into a fissure between the rocks. {name} takes the long way around the nest, ' +
          'and walks more carefully for the rest of the day.',
      },
    ],
    narrativeTemplates: {
      initiation: 'A venomous serpent waits where {name}\'s foot would have fallen on the {location} path.',
      success: 'The serpent is dealt with. The path is open.',
      failure: 'The serpent withdrew. {name} took the long way around.',
    },
  },

  // ── borderland.wolves_at_dusk ──────────────────────────────────────────────
  {
    id: 'borderland.wolves_at_dusk',
    name: 'Wolves at Dusk',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'camp', 'farmland'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Eyes catch the firelight at the edge of {name}\'s camp — green, gone, green again, in a slow rotation ' +
          'that means there are more of them than the eyes are showing. The fire is good. The fire is not enough. ' +
          '{?has_ally}{ally:strongest} would take a watch. Tonight {name} is the whole watch.{/has_ally}' +
          '{?no_ally}No second guard. The night is {name}\'s alone, and the night has weight.{/no_ally}',
        successAfterimage:
          '{name} keeps the fire high and {their} back to the rock-face. The pack probes for an opening ' +
          'and finds none, which is what a wolf needs to find before it commits.',
        failureAfterimage:
          'A wolf comes from the angle the fire does not reach. {name} turns half a beat too slow, ' +
          'and the pack draws blood for the first time tonight.',
      },
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#beast'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#beast'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'The alpha holds the pack together. Wolves work in conviction; without the leader\'s, ' +
          'they are only six tired animals in a cold field outside {location}.',
        successAfterimage:
          'A burning brand, hurled accurately. The alpha yelps — a sound that travels — and the pack melts ' +
          'into the dark in the shape that only a broken pack makes.',
        failureAfterimage:
          'The wolves persist past the brand and well into the small hours. {name} survives the night. ' +
          'Survives is the right word. There is no sleep in it.',
      },
    ],
    narrativeTemplates: {
      initiation: 'A wolf-pack circles {name}\'s camp at dusk near {location}.',
      success: 'The pack broke and ran. The dawn comes quietly.',
      failure: '{name} held until dawn, but barely. The pack remembers the camp.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Wolves outside {location} have either been pushed off the map or written {name} onto theirs. ' +
          'Wilderness keeps its own ledger.',
        changes: [
          {
            id: 'wolves_outcome',
            kind: 'reputation_tally',
            title: 'Wilderness Mark',
            detail: 'The pack carries a memory of this hex now, regardless of who slept and who didn\'t.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the dawn after?',
        reactions: [
          {
            id: 'wolves_pack_returns',
            label: 'The pack will be back, in season.',
            intent:
              'A wolf-pack does not forget a camp that fed it nothing. It also does not forget a camp ' +
              'that nearly fed it everything. Either way, the same hex draws them again — ' +
              'in winter, when hunger reorganizes the whole map.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'borderland.wolves_at_dusk',
                delayTicks: 45,
                priority: 0.7,
                seedLabel: 'A wolf-pack with a memory of {name} has returned to the {location} woods',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── borderland.spider_nest ─────────────────────────────────────────────────
  {
    id: 'borderland.spider_nest',
    name: 'Giant Spider Nest',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['ruins', 'wilderness', 'ruined_tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ['courage_prudence', 'revelation_discretion'],
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Gossamer threads catch the light between the crumbled pillars at {location}. Too thick for any common spider, ' +
          'and arranged by something that thinks in geometry. {name} studies the pattern before stepping into it.',
        successAfterimage:
          '{name} reads the web the way a tracker reads a trail — anchor strands here, signal lines there, ' +
          'and the safe seam between. The nest is avoidable. Barely.',
        failureAfterimage:
          'A strand catches {name}\'s sleeve. The vibration travels the whole web, and somewhere in the dark ' +
          'a thing the size of a hunting dog stops doing whatever it was doing.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.40 },
            tagFilters: ['#combat'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'A spider the size of a hunting dog emerges from the shadows, legs tapping stone in a precise, awful rhythm. ' +
          '{?has_artifact}{name} sets {artifact:weapon} between {them} and the legs, and waits for the lunge.{/has_artifact}' +
          '{?no_artifact}{name} works with what {they} brought — fire, mostly. Fire and a steady hand.{/no_artifact}',
        successAfterimage:
          'Fire takes the web before the creature does. The nest collapses into itself, a smell like burned hair, ' +
          'and the creature flees deeper into the ruin to whatever older thing fed it first.',
        failureAfterimage:
          'The spider has the angle it wants. {name} backs out of the ruin with the web still on {their} sleeves ' +
          'and chooses not to come back. Some places are best left to what arranged them.',
      },
    ],
    narrativeTemplates: {
      initiation: 'A nest of giant spiders has spread through the {location} ruins.',
      success: 'The nest is burned out. The ruins are quieter.',
      failure: '{name} retreated. The ruins remain claimed.',
    },
  },

  // ── borderland.swamp_lurker ────────────────────────────────────────────────
  {
    id: 'borderland.swamp_lurker',
    name: 'Swamp Lurker',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'oasis'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The water at {location} is too still. Bubbles rise where no wind disturbs the surface. ' +
          'Reeds twitch at the wrong angle, and a heron that should be hunting is on the bank doing nothing instead. ' +
          'The heron knows. {name} catches up to what the heron knows.',
        successAfterimage:
          '{name} reads the faintest ripple — the lurker is there, just under the meniscus, ' +
          'the patient kind of hungry that does not need to surface to study {them}.',
        failureAfterimage:
          'The water erupts before {name} is set. Jaws catch nothing but reed-mat, ' +
          'and {name} stumbles back into the muck with worse footing than {they} started with.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#beast'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.05,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#beast'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'The creature rises — scaled, low-slung, all jaws and tail and ancient patience. ' +
          'The footing is bad in three directions and worse in the fourth. ' +
          '{?has_ally}If {ally:strongest} were on the bank with a rope, this would be a different kind of fight. ' +
          'It is not that fight tonight.{/has_ally}',
        successAfterimage:
          '{name} finds the one piece of solid ground in this cursed clearing and puts steel where it counts. ' +
          'The lurker thrashes once and sinks back into the dark water that made it.',
        failureAfterimage:
          'The swamp fights on the lurker\'s side. {name} retreats to dry land bruised, mud-caked, ' +
          'and aware that this hex has a name in it now that it did not have an hour ago.',
      },
    ],
    narrativeTemplates: {
      initiation: 'Something ancient waits in the still water at {location}.',
      success: 'The lurker is gone. The marsh settles.',
      failure: '{name} retreated. The water keeps its name.',
    },
  },

  // ── borderland.carrion_birds ───────────────────────────────────────────────
  {
    id: 'borderland.carrion_birds',
    name: 'Carrion Bird Flock',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'battleground', 'farmland'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'They come down out of the {location} sky in a shrieking cloud — too many to count, too hungry to scare easily. ' +
          'Carrion birds, oversized, the kind that follow armies and decide afterward they could have done the killing themselves. ' +
          '{name} swats at beaks and talons and the air is mostly feathers.',
        successAfterimage:
          'A wing cracks under {name}\'s arm. The flock lifts as one and screams its way upward. ' +
          'Easy prey {name} is not.',
        failureAfterimage:
          'The birds are relentless. {name} takes a dozen small cuts before they decide there is easier meat to argue over.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#beast'],
          },
          reputationDelta: 0.02,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The birds circle, unwilling to commit and unwilling to leave. {name} has to convince them that the gear at {their} feet ' +
          'is not worth the next descent.',
        successAfterimage:
          'A smoky torch and a covered pack. The flock drifts toward easier pickings, and the road becomes a road again.',
        failureAfterimage:
          'One bird snatches a wrapped parcel and is gone before {name} can move. ' +
          'Minor loss; the kind that counts only after a long string of others.',
      },
    ],
    narrativeTemplates: {
      initiation: 'A flock of oversized carrion birds descends on {name} near {location}.',
      success: 'The birds lift. The road is clear.',
      failure: 'The flock got something. The road continues regardless.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  RUINS SCAVENGERS & MINOR SUPERNATURAL (7 templates)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── borderland.ruins_scavengers ────────────────────────────────────────────
  {
    id: 'borderland.ruins_scavengers',
    name: 'Ruins Scavengers',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['ruins', 'ruined_village', 'ruined_city', 'ruined_tower'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ['courage_prudence', 'honesty_cunning'],
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'Figures crouch among the rubble at {location}, prying foundation-stones loose with iron bars. ' +
          'They see {name} a beat after {name} sees them, and there is the small, ugly silence in which both sides ' +
          'decide whether this is going to be a conversation or a fight. ' +
          '{?has_ally}{ally:strongest} would push for the conversation. ' +
          '{name}, alone, has to make the call without the second voice.{/has_ally}',
        successAfterimage:
          '{name} steps forward with hand to hilt and not yet drawing. The scavengers exchange the look ' +
          'that men exchange when the math has just changed, and step back from the stones.',
        failureAfterimage:
          'They hold their ground — they know these ruins, and {name} does not. ' +
          'The rubble has angles {name} cannot see from here.',
      },
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.80, condition: 0.20 },
            tagFilters: ['#ancient'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#ancient'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'The deeper chambers may hold more looters — or worse, the things looters are trying to outrun. ' +
          '{name} pushes further into the dark.',
        successAfterimage:
          'The last of the scavengers flee through a collapsed wall, leaving their tools behind. ' +
          'The ruin is {name}\'s for as long as the daylight lasts, and ruins of this age give their secrets only to whoever stays.',
        failureAfterimage:
          'The chambers turn on themselves the way old buildings do. {name} loses bearing somewhere past the second cellar ' +
          'and exits the ruin with nothing but dust on {their} boots and a story not worth telling.',
      },
    ],
    narrativeTemplates: {
      initiation: 'Scavengers are picking the stones from the ruins at {location}.',
      success: 'The scavengers fled. The ruin is quiet.',
      failure: '{name} got turned around. The scavengers won the day.',
    },
  },

  // ── borderland.restless_bones ──────────────────────────────────────────────
  {
    id: 'borderland.restless_bones',
    name: 'Restless Bones',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['ruins', 'battleground', 'ruined_village'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'entropy',
    motivations: ['courage_prudence', 'mercy_ruthlessness'],
    steps: [
      {
        reach: 'veil',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The soil at {location} shifts in the wrong way — not animal-burrow, not root-heave. ' +
          'A skeletal hand claws its way free of earth that has been holding it for a long time, and then another hand. ' +
          'The bones drag themselves upright with a purpose that is not a person\'s purpose.',
        successAfterimage:
          '{name} reads the binding at a glance — weak, frayed, a curse held together more by spite than by magic. ' +
          'The shamble has limits. The limits are knowable.',
        failureAfterimage:
          'They rise faster than {name} budgeted for. By the time steel is out, three of them are between {name} and the road.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#ancient'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.05,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#ancient'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'Three shamblers close in, rusty weapons raised in mechanical hatred. ' +
          'The trick with this kind of dead is the shape of the curse, not the bone-by-bone arithmetic.',
        successAfterimage:
          '{name} shatters the lead skeleton — and the others fold where they stand, ' +
          'the binding too thin to hold itself up without the leader. Somewhere a curse breathes out.',
        failureAfterimage:
          'The bones keep coming, and coming, and coming. {name} retreats from the cursed ground ' +
          'and leaves the dead to a patrol they will not stop walking.',
      },
    ],
    narrativeTemplates: {
      initiation: 'The dead are restless in the soil at {location}.',
      success: 'The bones are back to being bones.',
      failure: 'The cursed ground still walks. {name} did not.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'Cursed ground at {location} has been engaged. Whether it is quiet now, or louder, the curse has been read.',
        changes: [
          {
            id: 'bones_outcome',
            kind: 'reputation_tally',
            title: 'Cursed-Ground Encounter',
            detail: 'The shape of an old binding has been seen. Knowledge of that shape persists.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the cursed soil?',
        reactions: [
          {
            id: 'bones_curse_lore',
            label: '{name} read the shape of the binding.',
            intent:
              'Curses, even small ones, have grammar. {name} carries the grammar of this one out of the field — ' +
              'how it knit itself, where it frayed, what it would have needed to hold longer. ' +
              'Useful knowledge, the kind that lets a person see the next curse before it rises.',
            effects: [
              {
                kind: 'intelligence',
                category: 'cultural_knowledge',
                label: 'Pattern of a borderland binding-curse',
                detail:
                  'The cadence at which the bones rose, the fraying of the binding, ' +
                  'the way the leader-skeleton anchored the rest. Useful against similar curses ' +
                  'and against whoever cast this one in the first place.',
                reliability: 0.7,
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── borderland.wisp_trail ──────────────────────────────────────────────────
  {
    id: 'borderland.wisp_trail',
    name: 'Will-o\'-the-Wisp Trail',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['wilderness', 'oasis', 'ruins'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'spirit',
    motivations: ['revelation_discretion', 'courage_prudence'],
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A pale light bobs through the trees ahead — too steady for firefly, too cold for torch, ' +
          'pulsing in a rhythm that is not a heart\'s. It is the sort of light that wants to be followed, ' +
          'and is honest enough to admit it.',
        successAfterimage:
          '{name} keeps distance. The wisp leads the way it leads — sometimes in a circle, sometimes off the trail, ' +
          'sometimes straight at something. Tonight is the third kind.',
        failureAfterimage:
          'The light dances away into the bog. {name} finds {them}self ankle-deep in muck ' +
          'and not on any path that can be retraced before dawn.',
      },
      {
        reach: 'veil',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.50, bestowed_power: 0.50 },
            tagFilters: ['#divine'],
          },
          reputationDelta: 0.03,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'The wisp hovers over a mossy stone in a clearing of {location}, pulsing slower now. ' +
          'Something is buried here, or bound, or both.',
        successAfterimage:
          'Beneath the stone — an old offering cache, the kind country folk used to leave for whatever the country was, ' +
          'before the country had a name. The wisp fades, purpose served, and the clearing settles.',
        failureAfterimage:
          'The wisp blinks out. Whatever it wanted to show remains hidden. {name} digs but finds only roots, ' +
          'and the clearing closes its argument without speaking.',
      },
    ],
    narrativeTemplates: {
      initiation: 'A pale light leads {name} off the {location} road.',
      success: 'The wisp\'s errand is complete. The light fades.',
      failure: 'The light blinked out. The clearing kept its secret.',
    },
  },

  // ── borderland.goblin_foragers ─────────────────────────────────────────────
  {
    id: 'borderland.goblin_foragers',
    name: 'Goblin Foragers',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['wilderness', 'farmland', 'camp', 'ruins'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A cluster of small, green-skinned creatures crouch in the {location} undergrowth, ' +
          'stuffing mushrooms into a sack with the seriousness of children who have been told this is work. ' +
          'They freeze when {name} steps into the clearing — a freezing that runs through them in order, ' +
          'tallest first, smallest last.',
        successAfterimage:
          '{name} shouts and the goblins scatter instantly, abandoning the sack. ' +
          'A chittering retreat through the brush, and a small, indignant face glaring back from twenty paces.',
        failureAfterimage:
          'One of them throws a rock with surprising accuracy. {name} dodges; the others use the dodge ' +
          'to vanish into a thornbreak that {name} is too large to follow into.',
      },
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#combat'],
          },
          reputationDelta: 0.02,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'Two stragglers hide behind a fallen log, chittering and throwing pebbles — too stubborn to flee, ' +
          'too small to fight, too proud to admit either.',
        successAfterimage:
          '{name} stomps once, decisively, and the last goblins bolt. The clearing is empty of all but the abandoned sack. ' +
          'It is a small victory; the borderland is full of them.',
        failureAfterimage:
          'The pebble-throwing turns into a low, coordinated harassment that {name} cannot quite punish without losing the road. ' +
          '{name} chooses the road, and the goblins keep their log.',
      },
    ],
    narrativeTemplates: {
      initiation: 'Goblin foragers are working the {location} undergrowth.',
      success: 'The goblins scattered. The clearing is empty.',
      failure: 'The goblins kept their log. {name} took the long way around.',
    },
  },

  // ── borderland.plague_rats ─────────────────────────────────────────────────
  {
    id: 'borderland.plague_rats',
    name: 'Plague Rat Swarm',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['ruins', 'hamlet', 'camp', 'ruined_village'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'entropy',
    motivations: ['courage_prudence', 'sacrifice_survival'],
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A carpet of matted fur and glinting eyes boils up out of a cellar at {location}. ' +
          'Rats — dozens of them, then hundreds, then weight, the way swarms become weight before they become numbers. ' +
          'Each one diseased, in its own small way.',
        successAfterimage:
          '{name} stamps and kicks, scattering the vanguard. Individual rats are nothing. ' +
          'The swarm is geometry, and {name} has read this geometry before.',
        failureAfterimage:
          'They are over the boots and up the trouser-legs before {name} can think the word "retreat." ' +
          '{name} flails, and flailing is bad against a swarm. {name} retreats anyway.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#beast'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#beast'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'The nest is below — a crawling mass in the dark. Fire would end it, ' +
          'but the building above it is dry, and the wind is up, and the village downwind has children in it.',
        successAfterimage:
          'A controlled burn. {name} works the edges with a wet cloak and a steady eye, ' +
          'and the nest goes without taking the rest of the structure with it.',
        failureAfterimage:
          'The rats scatter into the walls before the fire takes. The nest survives, and the plague survives, ' +
          'and somewhere downwind a child cough that was not there yesterday is there tomorrow.',
      },
    ],
    narrativeTemplates: {
      initiation: 'A plague-rat nest has taken the cellar at {location}.',
      success: 'The nest is burned. The plague stops here.',
      failure: 'The nest survived. The plague will travel.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'A plague nest at {location} — the kind of small ugliness that decides whole hamlets in the next season.',
        changes: [
          {
            id: 'plague_outcome',
            kind: 'reputation_tally',
            title: 'Plague Watch',
            detail: 'A nest has been engaged. The hamlets downwind will know one way or the other within a fortnight.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the cellar-fire?',
        reactions: [
          {
            id: 'plague_witness_mark',
            label: 'A village downwind will tell this story.',
            intent:
              'Plague is a slow rumour. Whether {name} stopped the nest or did not, the people of {location} ' +
              'and the hamlets downwind of it will hear a version of this hour, and the version will travel.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: 0.30,
                label: 'How {name} handled the plague-nest at {location}',
                revealFamilies: ['borderland', 'tavern', 'investigation'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // ── borderland.camp_raiders ────────────────────────────────────────────────
  {
    id: 'borderland.camp_raiders',
    name: 'Camp Raiders',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'shadow',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['camp', 'farmland', 'wilderness'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        reach: 'shadow',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'A crash in the dark — supplies being rifled with hurry instead of skill. ' +
          'Two voices, both low. {name} rolls from the bedroll into a crouch, hand already on hilt, ' +
          'the way bodies learn to do after the second time it happens. ' +
          '{?has_ally}{ally:strongest} would already be the second pair of eyes. ' +
          'Tonight {name} is alone in the camp at {location}, and alone is a different math.{/has_ally}' +
          '{?no_ally}No second guard, no shouted warning. The dark and {name}\'s breath, and not much else.{/no_ally}',
        successAfterimage:
          '{name} moves silently into position. Two figures crouched over the supply crates, oblivious, ' +
          'and one of them is reaching for a wrapped parcel with the kind of certainty that means ' +
          'they have done this before, in someone else\'s camp.',
        failureAfterimage:
          'A pot kicked in the dark. The raiders hear, and they grab what their hands can hold ' +
          'and run before the question of whether to fight gets asked.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.60, condition: 0.40 },
            tagFilters: ['#combat'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.05,
        },
        failureMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
          reputationDelta: -0.02,
        },
        narrativeTemplate:
          'They draw short blades — they would rather fight for the haul than walk back empty. ' +
          'In firelight, two against one is geometry, and {name} has the better angle.',
        successAfterimage:
          '{name} puts the first raider down and the second throws hands up before the question is asked. ' +
          'The camp is secure, the supplies are mostly intact, and the night smells of doused embers and salt sweat.',
        failureAfterimage:
          'They are quick and desperate, and desperate is its own training. ' +
          'Half the supplies are gone before {name} can stop them, and the other half is in disorder ' +
          'that {name} will spend the next morning sorting.',
      },
    ],
    narrativeTemplates: {
      initiation: 'Raiders crash {name}\'s camp at {location} in the small hours.',
      success: 'The camp is secure. One raider is down, one is fleeing.',
      failure: 'The raiders got half the supplies. The morning will be a long one.',
    },
  },
];

// ─── Lookup ──────────────────────────────────────────────────────────────────

/**
 * Look up a borderland encounter template by ID.
 * Returns undefined if not found — callers should use getAnyEncounterById instead.
 */
export function getBorderlandEncounterById(id: string): UnifiedActionTemplate | undefined {
  return BORDERLAND_ENCOUNTER_TEMPLATES.find(t => t.id === id);
}
