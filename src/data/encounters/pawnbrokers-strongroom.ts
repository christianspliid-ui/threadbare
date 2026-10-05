/**
 * The Cooper's Pawned Box (slug pawnbrokers-strongroom) - slot 4 of the expert-everyday-2 batch (THR-1679).
 * 
 * Brief: `Docs/plans/encounters/expert-everyday-2-brief.md`.
 * Final: `Docs/plans/encounters/pawnbrokers-strongroom-final.md`. Package critic: `pawnbrokers-strongroom-package.md`.
 * plotHookTaken: hook.descent_into_darkness - the strongroom is under the house, down a stair; the candle is short.
 * 
 * --- The narrator's 12 questions, answered ---
 *   1 P1 arrival?      Yes, per class: a cooper finds {actor} in {location} (urban) / {actor} reaches {location}
 *                      the night before the fair (rural). Graph names.
 *   2 P2 events?       He pawned the box for winter grain; the pawnbroker swore to hold it and will sell it;
 *                      the buyer hired {cast:rival}. Costs paid: the pledge and the broken word.
 *   3 P3 one stake?    Contest (rolled): {cast:rival} wants the same box tonight. The suspect role compounds it
 *                      on purpose: any theft is blamed on {actor}.
 *   4 <=80 words?      79 / 80.
 *   5 Read aloud?      Report throughout; no interior sensation.
 *   6 Stated?          Broken promise, rival, dog at the stair and blame each take one plain sentence.
 *   7 Every sentence works? Challenge, test or outcome.
 *   8 Nothing unintroduced? Cooper, box, pawnbroker, fair, rival, dog, stair in the spine before any card.
 *   9 One named person? {cast:rival}; the cooper, pawnbroker and buyer are role nouns.
 *  10 Stake in a sentence? Can {actor} get the cooper's box out of the strongroom before the buyer's thief,
 *                      without being named for it?
 *  11 Cards verb+noun? Tame The Guard Dog, Quiet The Cellar Stair, Hold The Coal Hatch.
 *  12 Opening per class? urban and rural, both written.
 * 
 * --- Mechanical design block ---
 *   Shape           Test & Consequence with the query-prize face. Shadow 0.60 (continue_weakened) -> shadow 0.66
 *                   (fail_action). Linear, branch count 0.
 *   Consequence hand (binding): story_seed (encounter_seed encounter.black_market_deal on step 1 success) +
 *                   drive (plant_compulsion steal 0.5, 72 ticks on step 1 failure). No swap.
 *   Query prize     Step 1 rewardPool { possession: 1 } tagFilters [#stealth] -> item_template.
 *   Extra writes    reputation_with $here -0.04 on step 0 failure (backs the critical_failure chip when a
 *                   step-0 critical failure ends the action) and -0.08 on step 1 failure.
 *   Cost channels   Hold The Coal Hatch is the batch's one Heavy Hand: essence 0, detectionDelta 0.15, one channel.
 *   Cool failure    Nobody is killed, jailed or branded; the dog lives.
 *   Accepted limit  No band-keyed step write exists: success_at_cost differs by prose and, on the house-woke
 *                   route, the unchipped step-0 standing debit.
 */

import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { compileOpeningEnvelope, expandSettings } from '../settingClasses';

/**
 * The annotated literal: excess-property checking on the real type is this
 * file's deep validator ('check:typecheck' fails on any unknown field).
 * 'consequenceDraw' is STAMPED from the binding draw (THR-1145) — edit it only
 * by re-running the compiler or recording a 'consequenceSwap'.
 */
const TEMPLATE_BASE: UnifiedActionTemplate = {
  id: 'encounter.town.pawnbrokers_strongroom',
  stakes: {
    goal: 'take the cooper\'s box back before the hired thief',
    risk: 'be found under the pawnbroker\'s house empty-handed',
    won: 'got the cooper\'s box out ahead of the hired thief',
    lost: 'lost the box to the hired thief and was named for it',
    lostBadly: 'was found under the pawnbroker\'s house empty-handed',
  },
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Cooper\'s Pawned Box',
  reach: 'shadow',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['honesty_cunning', 'courage_prudence'],
  settings: ['rural', 'urban'],
  openings: {
    urban: 'A cooper finds {actor} in {location} on the night before the fair.',
    rural: '{actor} reaches {location} the night before the fair; a cooper finds them.',
  },
  steps: [
    {
      reach: 'shadow',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.6,
      purposeLine: 'Get into the strongroom',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'He pawned his father\'s iron box for winter grain. The pawnbroker swore to hold it until quarter '
        + 'day, but will sell it at the fair tomorrow. The buyer has hired {cast:rival} to take it tonight. '
        + 'The cooper asks {actor} to get there first. A starved, lame dog guards the stair down to the '
        + 'strongroom. The pawnbroker saw them talking, so any theft will be blamed on {actor}.',
      criticalSuccessAfterimage: 'They slipped past the dog and down the stair, and opened the strongroom without a sound.',
      successAfterimage: 'They got past the dog and opened the strongroom lock in the dark.',
      successAtCostAfterimage: 'They opened the strongroom, but the dog whined, and a light moved in the house above.',
      failureAfterimage: 'The dog barked twice before the lock gave, and the house above them woke.',
      criticalFailureAfterimage: 'The dog barked until the house woke, and {cast:rival} heard where they were.',
      failureMetadata: {
        effects: [
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: -0.04,
          },
        ],
      },
      deal: {
        count: 4,
        tags: ['shadow', 'wild'],
      },
      nudges: [
        {
          id: 'strongroom.tame_the_guard_dog',
          name: 'Tame The Guard Dog',
          sphere: 'life',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.mercy',
          effectLine: 'Close the animal\'s wounds and fill its belly, so it lies down and lets them pass.',
          bandProse: {
            critical_success: 'The dog ate from their hand and lay down across the stair behind them.',
            success: 'The dog\'s bad leg stopped hurting, and it slept through them passing.',
            near_miss: 'The dog lay quiet, then whined for more food as they reached the door.',
            failure: 'Fed and whole again, the dog stood up and guarded its door.',
            critical_failure: 'Fed and whole again, the dog was strong enough to bark all night.',
          },
        },
        {
          id: 'strongroom.quiet_the_cellar_stair',
          name: 'Quiet The Cellar Stair',
          sphere: 'matter',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.matter',
          effectLine: 'Settle every loose board under their feet, so the steps down take their weight in silence.',
          bandProse: {
            success_at_cost: 'The steps held silent, but the strongroom door groaned as it opened.',
            failure: 'The steps made no sound, and the dog heard them anyway.',
          },
        },
      ],
    },
    {
      reach: 'shadow',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.66,
      purposeLine: 'Beat the rival out',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: 'Their candle will not last long. The box is on the top shelf. The pawnbroker says the cooper '
        + 'missed a payment, which frees him from his word. {cast:rival} is forcing the coal hatch at the '
        + 'far end of the cellar. Whoever gets the box out of the house first keeps it.',
      criticalSuccessAfterimage: 'They carried the box up the stair and out while {cast:rival} was still at the coal hatch.',
      successAfterimage: 'They were out of the back door with the box before {cast:rival} reached the shelf.',
      successAtCostAfterimage: 'They got the box out, but {cast:rival} was in the yard when they came up.',
      failureAfterimage: '{cast:rival} reached the shelf first and was gone with the box.',
      criticalFailureAfterimage: '{cast:rival} took the box, and the candle died with {actor} still in the strongroom.',
      successMetadata: {
        rewardPool: {
          categoryWeights: {
            possession: 1,
          },
          tagFilters: ['#stealth'],
        },
        effects: [
          {
            kind: 'encounter_seed',
            templateId: 'encounter.black_market_deal',
            targetAgentId: '$actor',
            delayTicks: 36,
            priority: 0.8,
            seedLabel: 'The buyer who lost the cooper\'s box sends word, with directions to a back room.',
          },
        ],
      },
      failureMetadata: {
        effects: [
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: -0.08,
          },
          {
            kind: 'plant_compulsion',
            targetAgentId: '$actor',
            encounterBias: {
              steal: 0.5,
            },
            durationTicks: 72,
            narrativeHook: 'Beaten to a lock by a hired thief, they want another lock to prove themselves on.',
          },
        ],
      },
      deal: {
        count: 4,
        tags: ['shadow', 'finesse'],
      },
      nudges: [
        {
          id: 'strongroom.hold_the_coal_hatch',
          name: 'Hold The Coal Hatch',
          sphere: 'force',
          essenceCost: 0,
          forecastDelta: 0.14,
          costs: {
            detectionDelta: 0.15,
          },
          opposes: 'rival',
          imageTag: 'generic.strength',
          effectLine: 'Keep the far door shut against an opponent with a weight no mortal could lift. Rival gods will '
            + 'see a hand this heavy.',
          bandProse: {
            critical_success: '{cast:rival} put a shoulder to the coal hatch twice, and it did not move.',
            success: 'The coal hatch held, and {cast:rival} had to come round by the yard.',
            near_miss: 'The hatch held until {cast:rival} broke the hinge, and they were only just out ahead.',
            failure: 'The hatch held, so {cast:rival} came in by the back door, between them and the yard.',
            critical_failure: 'The hatch held so hard that the whole house heard {cast:rival} beating on it.',
          },
        },
      ],
    },
  ],
  traitVariants: [
    {
      traitId: 'trait.mastery.shadow-walker',
      forecastDelta: 0.05,
      factorLine: 'Being a Shadow Walker, they cross a cellar without a sound.',
    },
    {
      traitId: 'trait.reputation.shadow.negative',
      forecastDelta: -0.05,
      factorLine: 'Being Infamous, they are the first one the pawnbroker\'s house watches for.',
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'rival',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['lookout', 'wanderer'],
      supportRole: 'hired_thief',
      spawnNpcRole: 'lookout',
      spawnName: 'Wren Hollis',
    },
  ],
  narrativeTemplates: {
    initiation: 'A cooper asks {actor} to take back his pawned box before the buyer\'s hired thief can fetch it.',
    success: 'The cooper has his box back, and the buyer\'s thief went home empty-handed.',
    failure: 'The cooper did not get his box back, and the pawnbroker named {actor} to the town.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'Morning comes to the fair. The cooper\'s box has left the pawnbroker\'s strongroom.',
      changes: [
        {
          id: 'strongroom.a_lock_in_the_dark',
          kind: 'growth',
          title: 'A lock in the dark',
          detail: 'A lock opened under a sleeping house teaches the shadow reach.',
          polarity: 'gain',
          concepts: [
            {
              text: 'shadow reach',
              tooltipId: 'reach.shadow',
            },
          ],
        },
      ],
      reactions: [],
      byOutcome: {
        critical_success: {
          overview: 'The cooper has his father\'s box back, and paid {actor} from inside it before the fair opened. '
            + 'The pawnbroker cannot cry theft without admitting he broke his word.',
          changes: [
            {
              id: 'strongroom.crit.buyer_seed',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
              title: 'The Buyer\'s Interest',
              detail: 'The buyer who lost the box will send for {actor}.',
              stateNoun: {
                text: 'seed',
                tooltipId: 'ui.aftermath_seed',
              },
              concepts: [
                {
                  text: '{actor}',
                  entityId: '$actor',
                  visualKind: 'agent',
                },
              ],
            },
          ],
        },
        success: {
          overview: 'The cooper has his box back and paid {actor} from inside it. The pawnbroker has lost his sale, '
            + 'and cannot complain without admitting he broke his word.',
          changes: [
            {
              id: 'strongroom.success.buyer_seed',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
              title: 'The Buyer\'s Interest',
              detail: 'The buyer who lost the box will send for {actor}.',
              stateNoun: {
                text: 'seed',
                tooltipId: 'ui.aftermath_seed',
              },
              concepts: [
                {
                  text: '{actor}',
                  entityId: '$actor',
                  visualKind: 'agent',
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview: 'The cooper has his box and paid {actor} from inside it, but the job was not clean.',
          changes: [
            {
              id: 'strongroom.cost.buyer_seed',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
              title: 'The Buyer\'s Interest',
              detail: 'The buyer who lost the box will send for {actor}.',
              stateNoun: {
                text: 'seed',
                tooltipId: 'ui.aftermath_seed',
              },
              concepts: [
                {
                  text: '{actor}',
                  entityId: '$actor',
                  visualKind: 'agent',
                },
              ],
            },
          ],
        },
        failure: {
          overview: '{cast:rival} took the cooper\'s box to the buyer at the fair gate. The pawnbroker found his lock '
            + 'opened and told {location} who he thinks did it.',
          changes: [
            {
              id: 'strongroom.fail.compulsion',
              kind: 'shell_state',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Beaten to the Box',
              causeClause: 'Outrun by a hired thief',
              detail: 'They look for a lock to prove themselves on.',
              stateNoun: {
                text: 'compulsion',
                tooltipId: 'ui.compulsion',
              },
              concepts: [
                {
                  text: 'a lock to prove themselves on',
                  tooltipId: 'ui.compulsion',
                },
              ],
            },
            {
              id: 'strongroom.fail.town_trust',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
              title: 'Named by the Pawnbroker',
              detail: '{location} thinks less of {actor}.',
              stateNoun: {
                text: 'reputation with {location}',
                entityId: '$here',
                visualKind: 'location',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'thinks less of',
                  tooltipId: 'ui.standing',
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview: 'The pawnbroker found {actor} below his house with empty hands, so he could not hold them. By '
            + 'noon the whole fair had heard his story.',
          changes: [
            {
              id: 'strongroom.critfail.town_trust',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
              title: 'Named Before the Fair',
              detail: '{location} thinks less of {actor}.',
              stateNoun: {
                text: 'reputation with {location}',
                entityId: '$here',
                visualKind: 'location',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'thinks less of',
                  tooltipId: 'ui.standing',
                },
              ],
            },
          ],
        },
      },
    },
  },
  description:
    'A cooper wants his father\'s pawned iron box out of a pawnbroker\'s strongroom before the '
    + 'buyer\'s hired thief fetches it. Between here and the box are a starved guard dog, a cellar '
    + 'stair and a race to the door.',
  locationSubtypes: expandSettings(['rural', 'urban']),
  consequenceDraw: ['story_seed', 'drive'],
};

export const PAWNBROKERS_STRONGROOM_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
