/**
 * The Judicial Duel (slug judicial-duel) - slot 4 of the master-everyday batch (THR-1688).
 * 
 * Brief: `Docs/plans/encounters/master-everyday-brief.md`.
 * Final: `Docs/plans/encounters/judicial-duel-final.md`. Package critic: `judicial-duel-package.md`.
 * plotHookRolled: hook.forbidden_knowledge_price, hook.monster_eradication, hook.swindled_family
 * plotHookTaken:  hook.swindled_family - a family cheated of its farm by a false sale asks for a champion it
 *                 cannot pay. Blended thinly with forbidden_knowledge_price (the order's new style, learned
 *                 by watching). monster_eradication dropped: no monster on an everyday board.
 * Seed dice: p3 mystery - opposition faction (orders; the order is scene fiction, its champion is cast) -
 *            disposition friendly - agentRole client who is owed (favor_creation, debtor the claimant) -
 *            scale region - system traits.
 * 
 * --- The narrator's 12 questions, answered ---
 *   1 P1 arrival?      Yes: {actor} arrives in {location} as the court calls a trial by combat.
 *   2 P2 events?       A fighting order claims the family farm under a sale by a cousin who never owned it.
 *   3 P3 one stake?    Mystery (rolled): nobody in the town has seen the order's champion fight.
 *   4 <=80 words?      71 / 80 (opening + step-0 spine).
 *   5 Read aloud?      Report throughout; no interior sensation.
 *   6 Stated?          "The family cannot pay, and offers a favour owed if the farm is saved."
 *   7 Every sentence works? Challenge, test or outcome.
 *   8 Nothing unintroduced? The drills, the crowd, the loose ground and the sworn oath appear in the
 *                      spines before any card acts on them.
 *   9 One named person? {cast:claimant} in step 0; {cast:champion} from step 1.
 *  10 Stake in a sentence? Can {actor} learn a style nobody has seen and win the bout that decides
 *                      the family's farm?
 *  11 Cards verb+noun? Slow Every Move, Reveal Old Habits, Rouse The Crowd, Twist Their Footing,
 *                      Weigh A False Oath. No effect line shares a word with its name.
 *  12 Opening per class? urban, written.
 * 
 * --- Mechanical design block ---
 *   Crux            A family's farm will be settled by trial by combat, and the mortal is their champion
 *                   against a fighter nobody here has seen.
 *   Shape           Puzzle - Investigation - Resolution. eye 0.72 (continue_weakened) -> iron 0.80
 *                   (continue_weakened) -> iron 0.84 (fail_action). Linear, branch count 0. Mean 0.787.
 *   Fight system    None. The bout is two nudge-resolved Iron steps; no monster card, no fight gate.
 *   Consequence hand (binding): thread + place, no swap. thread: thread_strengthen / thread_weaken
 *                   ($ascendant <-> $actor) on step 2 success / failure - trial by combat is an appeal to
 *                   heaven's verdict. place: apply_condition trait.condition.location.under_watch on $here
 *                   on step 2 failure (the order's men stay to hold the farm); the success-side reaction
 *                   'Stand the square a feast' writes trait.condition.location.festival on $here.
 *   Favour          favor_creation debtor $cast:claimant on step 2 success (the agent's rolled role).
 *   Standing        reputation_with $here +0.06 / -0.06 on step 2; -0.02 on step 0 and step 1 failure
 *                   (backs the critical_failure chip on every route).
 *   Cost channels   All specials essence-priced. No Heavy Hand, no rider, no grant.
 *   Cool failure    Nobody dies or is jailed. The family loses the farm and the master's name is spent
 *                   in front of the valley.
 *   Accepted limits A clean-route success_at_cost carries its leg cut in prose only; a step-2
 *                   critical_failure writes thread_weaken and Under Watch unchipped (the band is shared
 *                   with the step-0/1 routes, where those chips would be unbacked).
 * 
 * --- Trait hooks ---
 *   Gate? None. Variant? trait.reputation.iron.positive +0.05, trait.reputation.iron.negative -0.04.
 *   Trait-only nudge? None. Trait fragment? None.
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
  id: 'encounter.town.judicial_duel',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Judicial Duel',
  reach: 'iron',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['mercy_ruthlessness', 'courage_prudence'],
  tags: ['#territorial'],
  settings: ['urban'],
  openings: {
    urban: '{actor} arrives in {location} as the court calls a trial by combat.',
  },
  steps: [
    {
      reach: 'eye',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.72,
      purposeLine: 'Read their style',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'A fighting order claims {cast:claimant}\'s family farm. The order bought it from a cousin who '
        + 'never owned it.\n\n'
        + '{cast:claimant} asks {actor} to be the family\'s champion. The family cannot pay, and offers a '
        + 'favour owed if the farm is saved. Nobody in {location} has seen the order\'s champion fight, but '
        + 'the champion drills each morning where anyone can watch.',
      criticalSuccessAfterimage: 'By the second morning they knew the style: a feint at the knee, then a cut at the head, every '
        + 'time.',
      successAfterimage: 'They learned the style\'s main trick: a feint low, then a cut high.',
      successAtCostAfterimage: 'They learned the feint low and the cut high, but the champion saw them watching and changed the '
        + 'drill.',
      failureAfterimage: 'They watched for three mornings and could not tell the feints from the real blows.',
      criticalFailureAfterimage: 'They read the style wrong and told {cast:claimant} it could be met head-on. {cast:claimant} sent '
        + 'them away and found another champion.',
      failureMetadata: {
        effects: [
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: -0.02,
          },
        ],
      },
      deal: {
        count: 3,
        tags: ['insight', 'might'],
      },
      nudges: [
        {
          id: 'duel.slow_every_move',
          name: 'Slow Every Move',
          sphere: 'time',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.focus',
          effectLine: 'Drag a fighter\'s motions a beat late, so anyone watching sees each one start.',
          bandProse: {
            critical_success: 'Every drill ran slow, and {actor} could follow each blade from start to finish.',
            success: 'The drills ran a beat slow, and {actor} saw where each cut began.',
            near_miss: 'The drills ran slow for one morning, and the champion changed them the next.',
            failure: 'The drills ran slow for a morning, but slow or fast, {actor} watched the wrong hand.',
          },
        },
        {
          id: 'duel.reveal_old_habits',
          name: 'Reveal Old Habits',
          sphere: 'mind',
          essenceCost: 2,
          forecastDelta: 0.08,
          imageTag: 'generic.memory',
          effectLine: 'Show the watcher the one move a trained body falls back on without thinking.',
          bandProse: {
            success: '{actor} saw the half-step back the champion takes before every cut.',
            success_at_cost: '{actor} saw the half-step back, the one habit the new drill could not hide.',
            failure: '{actor} saw a half-step back once, and took it for a stumble.',
            critical_failure: '{actor} saw a habit that was never there, and built a plan on it.',
          },
        },
      ],
    },
    {
      reach: 'iron',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.8,
      purposeLine: 'Survive the first rush',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The market square is roped off and packed. Families have come from across the valley, afraid '
        + 'their own old titles could be taken the same way. {cast:champion}, the order\'s champion, '
        + 'salutes {actor} like a friend and swears before the court that the order\'s claim is true. Then '
        + 'the champion comes in fast.',
      criticalSuccessAfterimage: 'They met the first rush and turned it, and {cast:champion} backed off bleeding.',
      successAfterimage: 'They took the first rush on their guard and gave no ground.',
      successAtCostAfterimage: 'They held the first rush, and took a cut across the forearm doing it.',
      failureAfterimage: 'The first rush drove them back to the rope, and the crowd groaned.',
      criticalFailureAfterimage: 'The first rush knocked the blade from their hand, and they yielded before the court.',
      carryoverFactorLines: {
        critical_success: {
          text: 'They know the feint before it comes.',
          polarity: 'for',
          forecastDelta: 0.06,
        },
        success: {
          text: 'They know how the style wins.',
          polarity: 'for',
          forecastDelta: 0.04,
        },
        success_at_cost: {
          text: 'The champion knows they were watching.',
          polarity: 'against',
          forecastDelta: -0.02,
        },
        near_miss: {
          text: 'They learned the style late.',
          polarity: 'against',
          forecastDelta: -0.03,
        },
        failure: {
          text: 'They do not know the style.',
          polarity: 'against',
          forecastDelta: -0.05,
        },
      },
      failureMetadata: {
        effects: [
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: -0.02,
          },
        ],
      },
      deal: {
        count: 3,
        tags: ['might', 'social'],
      },
      nudges: [
        {
          id: 'duel.rouse_the_crowd',
          name: 'Rouse The Crowd',
          sphere: 'spirit',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.crowd',
          effectLine: 'Lift every onlooker into one loud voice for them, so it steadies them and rattles whoever they '
            + 'face.',
          bandProse: {
            critical_success: 'The square roared {actor}\'s name, and {cast:champion} looked at the crowd instead of the blade.',
            success: 'The crowd shouted for the family\'s champion, and {actor} fought into the noise.',
            near_miss: 'The crowd shouted for {actor}, then fell quiet when the champion pressed.',
            failure: 'The crowd roared for {actor}, and {cast:champion} paid it no attention.',
          },
        },
        {
          id: 'duel.twist_their_footing',
          name: 'Twist Their Footing',
          sphere: 'chaos',
          essenceCost: 1,
          forecastDelta: 0.08,
          opposes: 'champion',
          imageTag: 'generic.luck',
          effectLine: 'Shift loose ground under an opponent at the worst moment, so the stroke they trust most goes '
            + 'wide.',
          bandProse: {
            success: '{cast:champion}\'s heel slid on a loose cobble, and the cut went past {actor}\'s shoulder.',
            success_at_cost: '{cast:champion} slipped and fell forward, and the falling blade caught {actor} on the way down.',
            failure: '{cast:champion} slipped, caught their balance, and came on harder.',
            critical_failure: 'A loose cobble turned under {actor} instead.',
          },
        },
      ],
    },
    {
      reach: 'iron',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.84,
      purposeLine: 'Win the bout',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: 'The bout goes on, and both fighters are tiring. The court will give the farm to whoever makes '
        + 'the other yield. {cast:champion} stops being polite and fights to win.',
      criticalSuccessAfterimage: '{cast:champion} went down on one knee and yielded before the court.',
      successAfterimage: '{actor} pressed until {cast:champion} yielded.',
      successAtCostAfterimage: '{cast:champion} yielded, and {actor} came out of the bout with a deep cut to the leg.',
      failureAfterimage: '{actor} was driven to the ground and yielded.',
      criticalFailureAfterimage: '{actor} was beaten down and yielded in front of the whole valley.',
      carryoverFactorLines: {
        critical_success: {
          text: '{cast:champion} is bleeding and wary.',
          polarity: 'for',
          forecastDelta: 0.06,
        },
        success: {
          text: 'They are fresh and unhurt.',
          polarity: 'for',
          forecastDelta: 0.04,
        },
        success_at_cost: {
          text: 'They are fighting with a cut forearm.',
          polarity: 'against',
          forecastDelta: -0.02,
        },
        near_miss: {
          text: 'They held the rush, but only just.',
          polarity: 'against',
          forecastDelta: -0.03,
        },
        failure: {
          text: 'They are fighting with their back to the rope.',
          polarity: 'against',
          forecastDelta: -0.05,
        },
      },
      successMetadata: {
        effects: [
          {
            kind: 'thread_strengthen',
            ascendantId: '$ascendant',
            mortalId: '$actor',
            reason: 'Won a trial by combat the town took for heaven\'s verdict',
          },
          {
            kind: 'favor_creation',
            magnitudeRange: [0.4, 0.6],
            context: 'Kept the family\'s farm in a trial by combat',
            debtorAgentId: '$cast:claimant',
          },
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: 0.06,
          },
        ],
      },
      failureMetadata: {
        effects: [
          {
            kind: 'thread_weaken',
            ascendantId: '$ascendant',
            mortalId: '$actor',
            reason: 'Lost a trial by combat the town took for heaven\'s verdict',
          },
          {
            kind: 'apply_condition',
            conditionTraitId: 'trait.condition.location.under_watch',
            targetLocationId: '$here',
            intensity: 0.6,
          },
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: -0.06,
          },
        ],
      },
      deal: {
        count: 4,
        tags: ['might', 'peril'],
      },
      nudges: [
        {
          id: 'duel.weigh_a_false_oath',
          name: 'Weigh A False Oath',
          sphere: 'order',
          essenceCost: 3,
          forecastDelta: 0.12,
          opposes: 'champion',
          imageTag: 'generic.oath',
          effectLine: 'Make the liar carry what they swore before witnesses, so their arm drags when they need it most.',
          bandProse: {
            critical_success: '{cast:champion} faltered on the false oath and never found the rhythm again.',
            success: '{cast:champion}\'s guard dropped at the end and did not come back up.',
            success_at_cost: '{cast:champion} faltered, and {actor} took the opening without guarding the leg.',
            near_miss: '{cast:champion} faltered once, and recovered before {actor} could use it.',
            failure: '{cast:champion} fought on as if the oath were true.',
            critical_failure: '{cast:champion} fought as if the oath were true, and harder for it.',
          },
        },
      ],
    },
  ],
  traitVariants: [
    {
      traitId: 'trait.reputation.iron.positive',
      forecastDelta: 0.05,
      factorLine: 'Being a Feared Champion, they have opponents fighting carefully.',
    },
    {
      traitId: 'trait.reputation.iron.negative',
      forecastDelta: -0.04,
      factorLine: 'Being known as a Brutal Thug, they have the square against them.',
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'claimant',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['merchant', 'trader'],
      supportRole: 'duel_claimant',
      spawnNpcRole: 'merchant',
      spawnName: 'Wenna Coldridge',
    },
    {
      kind: 'actor',
      key: 'champion',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      supportRole: 'duel_order_champion',
      spawnNpcRole: 'warrior_priest',
      spawnName: 'Corvin Ashe',
    },
  ],
  narrativeTemplates: {
    initiation: 'A family\'s farm will be settled by trial by combat, and they ask a master to fight for them.',
    success: 'The order\'s champion yielded, and the court gave the farm back to the family.',
    failure: 'The order\'s champion won, and the court gave the farm to the order.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The court reads its verdict, and the crowd leaves the square.',
      changes: [],
      reactions: [
        {
          id: 'duel.offer_the_champion_a_hand',
          label: 'Offer the beaten champion a hand',
          intent: 'The mortal helps the order\'s champion up in front of the court. The champion will remember it.',
          effects: [
            {
              kind: 'bond_change',
              withAgentId: '$cast:champion',
              sentimentDelta: 0.12,
            },
          ],
        },
        {
          id: 'duel.stand_the_square_a_feast',
          label: 'Stand the square a feast',
          intent: 'The mortal turns the verdict into a feast in the square, and the town takes a holiday.',
          effects: [
            {
              kind: 'apply_condition',
              conditionTraitId: 'trait.condition.location.festival',
              targetLocationId: '$here',
              intensity: 0.5,
            },
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          overview: 'The court gives the farm back to {cast:claimant}\'s family and writes the verdict into its '
            + 'rolls. Families from across the valley come to shake {actor}\'s hand.',
          changes: [
            {
              id: 'duel.crit.thread',
              kind: 'growth',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'thread',
                tooltipId: 'ui.thread',
              },
              title: 'Judged in the Square',
              detail: 'The god\'s thread to {actor} runs stronger.',
              concepts: [
                {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
              ],
            },
            {
              id: 'duel.crit.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              title: 'A Champion\'s Due',
              detail: '{cast:claimant} owes {actor} a favour now.',
              concepts: [
                {
                  text: '{cast:claimant}',
                  entityId: '$cast:claimant',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'duel.crit.regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'reputation with {location}',
                entityId: '$here',
                visualKind: 'location',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'thinks well of',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Town\'s Regard',
              detail: '{location} thinks well of {actor} now.',
            },
          ],
        },
        success: {
          overview: 'The court gives the farm back to {cast:claimant}\'s family. The order\'s people pack their carts '
            + 'and leave {location} by evening.',
          changes: [
            {
              id: 'duel.win.thread',
              kind: 'growth',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'thread',
                tooltipId: 'ui.thread',
              },
              title: 'Judged in the Square',
              detail: 'The god\'s thread to {actor} runs stronger.',
              concepts: [
                {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
              ],
            },
            {
              id: 'duel.win.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              title: 'A Champion\'s Due',
              detail: '{cast:claimant} owes {actor} a favour now.',
              concepts: [
                {
                  text: '{cast:claimant}',
                  entityId: '$cast:claimant',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'duel.win.regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'reputation with {location}',
                entityId: '$here',
                visualKind: 'location',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'thinks well of',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Town\'s Regard',
              detail: '{location} thinks well of {actor} now.',
            },
          ],
        },
        success_at_cost: {
          overview: 'The court gives the farm back to {cast:claimant}\'s family, but the whole square saw how near '
            + 'the order came to winning.',
          changes: [
            {
              id: 'duel.cost.thread',
              kind: 'growth',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'thread',
                tooltipId: 'ui.thread',
              },
              title: 'Judged in the Square',
              detail: 'The god\'s thread to {actor} runs stronger.',
              concepts: [
                {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
              ],
            },
            {
              id: 'duel.cost.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              title: 'A Champion\'s Due',
              detail: '{cast:claimant} owes {actor} a favour now.',
              concepts: [
                {
                  text: '{cast:claimant}',
                  entityId: '$cast:claimant',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'duel.cost.regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'reputation with {location}',
                entityId: '$here',
                visualKind: 'location',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'thinks well of',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Town\'s Regard',
              detail: '{location} thinks well of {actor} now.',
            },
          ],
        },
        failure: {
          overview: 'The court gives the farm to the order, and {cast:claimant}\'s family must leave it.',
          changes: [
            {
              id: 'duel.fail.under_watch',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'Under Watch',
                entityId: 'trait.condition.location.under_watch',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'Under Watch',
                  entityId: 'trait.condition.location.under_watch',
                  visualKind: 'attachment',
                },
              ],
              title: 'The Order Stays',
              detail: 'The order\'s men keep watch on {location} now.',
            },
            {
              id: 'duel.fail.thread',
              kind: 'growth',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'thread',
                tooltipId: 'ui.thread',
              },
              title: 'Judged and Found Wanting',
              detail: 'The god\'s thread to {actor} runs thinner.',
              concepts: [
                {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
              ],
            },
            {
              id: 'duel.fail.regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
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
              title: 'The Town\'s Regard',
              detail: '{location} thinks less of {actor} now.',
            },
          ],
          reactions: [
            {
              id: 'duel.fail.load_the_cart',
              label: 'Load the family\'s cart',
              intent: 'The mortal stays to help the family move out. The family will remember who stayed.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:claimant',
                  sentimentDelta: 0.12,
                },
              ],
            },
            {
              id: 'duel.fail.ask_about_the_style',
              label: 'Ask the champion to explain the style',
              intent: 'The mortal asks the order\'s champion how the style is won, and keeps the answer.',
              effects: [
                {
                  kind: 'intelligence',
                  category: 'cultural_knowledge',
                  label: 'The Order\'s Style',
                  detail: 'The order\'s fighters feint low and cut high, and step back before every cut.',
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview: 'The court gives the farm to the order. {cast:claimant} tells the whole square that the family '
            + 'trusted {actor}, and {actor} failed them.',
          changes: [
            {
              id: 'duel.critfail.regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
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
              title: 'Lost Before the Valley',
              detail: '{location} thinks less of {actor} now.',
            },
          ],
          reactions: [
            {
              id: 'duel.critfail.load_the_cart',
              label: 'Load the family\'s cart',
              intent: 'The mortal stays to help the family move out. The family will remember who stayed.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:claimant',
                  sentimentDelta: 0.12,
                },
              ],
            },
            {
              id: 'duel.critfail.ask_about_the_style',
              label: 'Ask the champion to explain the style',
              intent: 'The mortal asks the order\'s champion how the style is won, and keeps the answer.',
              effects: [
                {
                  kind: 'intelligence',
                  category: 'cultural_knowledge',
                  label: 'The Order\'s Style',
                  detail: 'The order\'s fighters feint low and cut high, and step back before every cut.',
                },
              ],
            },
          ],
        },
      },
    },
  },
  description: 'A three-step master Iron job in a town: a fighting order claims a family\'s farm under a false '
    + 'sale, and the court sets a trial by combat in the market square. The mortal, hired as the '
    + 'family\'s champion for a favour owed, studies the order\'s unfamiliar style, survives the first '
    + 'rush and fights for the yield. A won bout keeps the farm, strengthens the god\'s thread and '
    + 'leaves the family owing the mortal; a lost one hands the farm to the order, whose men stay to '
    + 'watch the town, and frays the thread.',
  locationSubtypes: expandSettings(['urban']),
  consequenceDraw: ['thread', 'place'],
};

export const JUDICIAL_DUEL_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
