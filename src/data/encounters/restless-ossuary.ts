/**
 * The Restless Charnel House (slug restless-ossuary) - slot 8 of the master-everyday batch (THR-1688).
 * 
 * Brief: `Docs/plans/encounters/master-everyday-brief.md`.
 * Final: `Docs/plans/encounters/restless-ossuary-final.md`. Package critic: `restless-ossuary-package.md`.
 * plotHookRolled: hook.haunted_relic, hook.the_convergence, hook.ritual_of_undeath
 * plotHookTaken:  hook.haunted_relic - an old relic buried with the weavers' first dead keeps them restless;
 *                 the prize is that relic, drawn by tag. The rite of laying is all that survives of the undeath
 *                 ritual; the convergence survives as every guild arriving at the same full room.
 * Seed dice: p3 contest - opposition terrain (indifference), read as the dead's indifference to the
 *            living's claims - agentRole judge_asked_to_rule - scale settlement - system favors (advisory, not taken).
 * 
 * --- The narrator's 12 questions, answered ---
 *   1 P1 arrival?      Yes: {actor} arrives in {location}, sent for by the cathedral's dean. Graph names.
 *   2 P2 events?       The charnel house is full; the dead move at night; the sexton no longer goes down.
 *   3 P3 one stake?    Contest (rolled): every guild wants its own bones kept in the same full room.
 *   4 <=80 words?      78 / 80 (opening + step-0 spine).
 *   5 Read aloud?      Report throughout; no interior sensation.
 *   6 Stated?          "the dead in it will not lie still", "each wants its own bones kept".
 *   7 Every sentence works? Challenge, test or outcome.
 *   8 Nothing unintroduced? Charnel house, bones, guilds, warden, dean, sexton are in the step-0 spine; the
 *                      rite, the threshold and the wardens' meeting are named in the step spines before any card.
 *   9 One named person? {cast:warden}; the dean and the sexton are role nouns.
 *  10 Stake in a sentence? Can {actor} lay the dead under the cathedral and rule which guild's bones move,
 *                      against the weavers' claim?
 *  11 Cards verb+noun? Remember Lost Names, Rouse The Restless Dead, Ward The Charnel Door, Slow The Long Night,
 *                      Seal The Verdict, Stir Old Grudges.
 *  12 Opening per class? urban, written.
 * 
 * --- Mechanical design block ---
 *   Crux            The dead under the town's cathedral will not lie still, and every guild wants its own bones kept.
 *   Shape           Query prize on a Puzzle - Investigation - Resolution spine. veil 0.74 (continue_weakened)
 *                   -> veil 0.80 (continue_weakened) -> veil 0.84 (fail_action). Linear, branch count 0.
 *   Consequence hand (binding): standing (reputation_with $here) + omen (emit_omen cultural/global on both
 *                   sides of step 1, the laying: spirit if the dead lie still, entropy if the rite breaks). No swap.
 *   Query prize     Step 2 rewardPool { possession: 1 } tagFilters [#relic]: the relic lifted from under the
 *                   weavers' first dead, which no guild will claim.
 *   Standing        reputation_with $here +0.06 / -0.06 on step 2; -0.02 on step 0 and step 1 failure (backs the
 *                   critical_failure chip on every route: a critical failure at any step ends the action).
 *   Omen            Unchipped: an omen is dressing and has no anchor kind. Told in step 1's afterimages.
 *   Cost channels   All specials essence-priced. No Heavy Hand, no rider, no Undertow.
 *   Cool failure    Nobody dies, is jailed or branded. Failure is the town's regard: a master sent for by name
 *                   who fails is not sent for again.
 *   Accepted limit  No band-keyed step write: critical_success and success_at_cost differ from success by prose.
 *   Not colliding   The veil experts call up a drowned man to testify and read a widow's dream; this one lays
 *                   the dead and judges between the living. No card questions the dead.
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
  id: 'encounter.town.restless_ossuary',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Restless Charnel House',
  reach: 'veil',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['tradition_novelty', 'courage_prudence'],
  settings: ['urban'],
  openings: {
    urban: '{actor} arrives in {location}, sent for by the cathedral\'s dean.',
  },
  steps: [
    {
      reach: 'veil',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.74,
      purposeLine: 'Read the restless dead',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The charnel house under the cathedral is full, and its dead will not lie still. Bones move at '
        + 'night, and the sexton no longer goes down.\n\n'
        + 'Every guild keeps its dead there, and none will let its own bones be moved. {cast:warden}, '
        + 'warden of the weavers, says theirs are the oldest. The dean asks {actor} to find the cause, lay '
        + 'the dead, and rule which bones go.',
      criticalSuccessAfterimage: 'They found the cause by midnight. The weavers\' first dead were dug up to make room, and an old '
        + 'relic buried with them was left loose.',
      successAfterimage: 'They traced the trouble to the weavers\' oldest dead, dug up last winter to make room for new '
        + 'burials.',
      successAtCostAfterimage: 'They traced the trouble to the weavers\' oldest dead, but {cast:warden} saw them handle the '
        + 'weavers\' bones and called it an insult.',
      failureAfterimage: 'They watched the bones until dawn and could not say why they moved. They will have to lay the '
        + 'dead without knowing.',
      criticalFailureAfterimage: 'They named the wrong dead as restless. The dean lost faith in them and called off the rite.',
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
        tags: ['lore', 'insight'],
      },
      nudges: [
        {
          id: 'ossuary.remember_lost_names',
          name: 'Remember Lost Names',
          sphere: 'mind',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.memory',
          effectLine: 'Bring back the worn marks on the oldest bones, so each one shows which guild laid it there.',
          bandProse: {
            critical_success: '{actor} read the worn guild marks on the oldest skulls and went straight to the weavers\' dead.',
            success: 'The worn marks on the oldest bones came clear enough to read, and they were the weavers\'.',
            near_miss: 'The marks came clear only near dawn, after a night spent on the wrong stacks.',
            failure: 'The worn marks came back, and showed that three guilds had stacked their dead together.',
          },
        },
        {
          id: 'ossuary.rouse_restless_dead',
          name: 'Rouse Restless Dead',
          sphere: 'spirit',
          essenceCost: 2,
          forecastDelta: 0.08,
          imageTag: 'generic.blessing',
          effectLine: 'Stir the uneasy bones harder for one night, so the cause of their trouble shows plainly.',
          bandProse: {
            success: 'The bones shifted hardest over one place in the weavers\' stacks, and {actor} dug there.',
            success_at_cost: 'The bones moved hard enough to fall, and {cast:warden} saw weavers\' skulls on the floor.',
            failure: 'The bones moved all through the charnel house at once, and showed no single cause.',
            critical_failure: 'A whole stack fell into the passage, and the sexton ran to wake the dean.',
          },
        },
      ],
    },
    {
      reach: 'veil',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.8,
      purposeLine: 'Lay the dead',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The rite of laying must be said over the restless bones from dusk until dawn without a break. '
        + 'Each time it stops, the bones move again. Every guild has sent people to watch over its own '
        + 'dead. {cast:warden} stands guard over the weavers\' bones and lets no one touch them.',
      criticalSuccessAfterimage: 'The rite was said to the end, and the dead lay still from midnight on. The town took the quiet '
        + 'night as a good sign.',
      successAfterimage: 'The rite held until dawn, and the dead lay still. The town took the quiet night as a good sign '
        + 'for the year.',
      successAtCostAfterimage: 'The dead lay still by dawn, but the rite broke twice, and the watching guilds saw the bones move '
        + 'each time. The town still took the quiet dawn as a good sign.',
      failureAfterimage: 'The rite broke before dawn, and the bones moved again in front of every guild. The town took the '
        + 'night as a bad sign.',
      criticalFailureAfterimage: 'The rite broke at midnight, and bones fell from the stacks into the passage. The guilds carried '
        + 'the story through the town as a bad sign.',
      carryoverFactorLines: {
        critical_success: {
          text: 'They know which bones are restless, and why.',
          polarity: 'for',
          forecastDelta: 0.06,
        },
        success: {
          text: 'They know which dead are restless.',
          polarity: 'for',
          forecastDelta: 0.04,
        },
        success_at_cost: {
          text: '{cast:warden} is angry that they touched the weavers\' bones.',
          polarity: 'against',
          forecastDelta: -0.02,
        },
        near_miss: {
          text: 'They found the restless dead only near dawn.',
          polarity: 'against',
          forecastDelta: -0.03,
        },
        failure: {
          text: 'They do not know why the dead are restless.',
          polarity: 'against',
          forecastDelta: -0.05,
        },
      },
      successMetadata: {
        effects: [
          {
            kind: 'emit_omen',
            category: 'cultural',
            intensity: 0.3,
            narrativeHook: 'The dead under a town\'s cathedral were laid in one night, and the town took the quiet for a '
              + 'good year.',
            scope: {
              kind: 'global',
            },
            sphereAlignment: 'spirit',
          },
        ],
      },
      failureMetadata: {
        effects: [
          {
            kind: 'emit_omen',
            category: 'cultural',
            intensity: 0.3,
            narrativeHook: 'The dead under a town\'s cathedral moved through the rite meant to lay them, and the town took '
              + 'it for a bad year.',
            scope: {
              kind: 'global',
            },
            sphereAlignment: 'entropy',
          },
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: -0.02,
          },
        ],
      },
      deal: {
        count: 3,
        tags: ['lore', 'peril'],
      },
      nudges: [
        {
          id: 'ossuary.ward_charnel_door',
          name: 'Ward Charnel Door',
          sphere: 'order',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.ward',
          effectLine: 'Set a line at the threshold the restless dead cannot cross, so what wakes below stays below.',
          bandProse: {
            critical_success: 'The dead stayed behind the line all night, and no watcher left a post.',
            success: 'The bones pressed at the threshold and did not cross it.',
            near_miss: 'The line held, but the guilds\' watchers would not stand near it, and the rite was said '
              + 'short-handed.',
            failure: 'The line held at the door, and the bones moved inside it instead.',
            critical_failure: 'The line held at the door, and shut the guilds\' watchers in with the moving dead until dawn.',
          },
        },
        {
          id: 'ossuary.delay_first_light',
          name: 'Delay First Light',
          sphere: 'time',
          essenceCost: 2,
          forecastDelta: 0.08,
          imageTag: 'generic.time-slow',
          effectLine: 'Stretch the dark hours before morning, so the whole rite is said in darkness.',
          bandProse: {
            success: 'Dawn came late, and the last words of the rite were said before it.',
            success_at_cost: 'Dawn came late, and the watchers grew afraid of the long dark and left their posts.',
            failure: 'The dark ran long, and the rite still broke before it was finished.',
          },
        },
      ],
    },
    {
      reach: 'veil',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.84,
      purposeLine: 'Rule between the guilds',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: 'At first light the guild wardens meet in the charnel house to hear the ruling. Every bone '
        + '{actor} names will be carried to new ground outside the walls. {cast:warden} says the weavers\' '
        + 'dead stay where they lie. The dead care nothing for the guilds\' claims. They will stay quiet '
        + 'only if the right bones are moved.',
      criticalSuccessAfterimage: 'The weavers\' oldest dead were carried out first, and a relic was found under them. Not one bone '
        + 'moved after. Every warden, {cast:warden} included, put a hand to the ruling.',
      successAfterimage: 'The bones {actor} named were carried out, and the dead stayed quiet. The wardens accepted the '
        + 'ruling.',
      successAtCostAfterimage: 'The dead stayed quiet, but {cast:warden} called the ruling theft and walked out before it was '
        + 'sealed.',
      failureAfterimage: 'The wrong bones were carried out, and the dead were moving again by night. The wardens tore up '
        + 'the ruling.',
      criticalFailureAfterimage: 'The bones began to move while the wardens were still arguing, and every guild left the charnel '
        + 'house blaming {actor}.',
      carryoverFactorLines: {
        critical_success: {
          text: 'The dead have lain quiet since the rite.',
          polarity: 'for',
          forecastDelta: 0.06,
        },
        success: {
          text: 'The rite held until dawn.',
          polarity: 'for',
          forecastDelta: 0.04,
        },
        success_at_cost: {
          text: 'The guilds saw the bones move during the rite.',
          polarity: 'against',
          forecastDelta: -0.02,
        },
        near_miss: {
          text: 'The rite held, but only just.',
          polarity: 'against',
          forecastDelta: -0.03,
        },
        failure: {
          text: 'The dead are still restless.',
          polarity: 'against',
          forecastDelta: -0.05,
        },
      },
      successMetadata: {
        rewardPool: {
          categoryWeights: {
            possession: 1,
          },
          tagFilters: ['#relic'],
        },
        effects: [
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
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: -0.06,
          },
        ],
      },
      deal: {
        count: 3,
        tags: ['lore', 'social'],
      },
      nudges: [
        {
          id: 'ossuary.seal_final_judgment',
          name: 'Seal Final Judgment',
          sphere: 'order',
          essenceCost: 2,
          forecastDelta: 0.08,
          imageTag: 'generic.oath',
          effectLine: 'Make a ruling sound settled and old, so the wardens stop arguing once it is given.',
          bandProse: {
            critical_success: 'The wardens heard the ruling once and asked for no second reading.',
            success: 'The wardens argued for an hour, then let the ruling stand.',
            near_miss: 'The wardens let the ruling stand, but only after {cast:warden} had it read three times.',
            failure: 'The wardens let the ruling stand, and the dead it left in place moved that night.',
            critical_failure: 'The wardens accepted the ruling at once, and the wrong bones went out the door before {actor} '
              + 'saw the mistake.',
          },
        },
        {
          id: 'ossuary.stir_old_grudges',
          name: 'Stir Old Grudges',
          sphere: 'chaos',
          essenceCost: 1,
          forecastDelta: 0.08,
          opposes: 'warden',
          imageTag: 'generic.rumor',
          effectLine: 'Remind the other guilds of every slight a rival has dealt them, so the rival stands alone.',
          bandProse: {
            success: 'The other wardens remembered old quarrels with the weavers, and none of them backed '
              + '{cast:warden}.',
            success_at_cost: 'The other wardens turned on {cast:warden}, and the weavers\' guild blamed {actor} for it.',
            failure: 'The old quarrels came up, and the wardens spent the morning on them instead of the ruling.',
            critical_failure: 'Every warden remembered a grudge, and the meeting broke up in shouting.',
          },
        },
      ],
    },
  ],
  traitVariants: [
    {
      traitId: 'trait.mastery.spell-weaver',
      forecastDelta: 0.05,
      factorLine: 'Being a Spell-Weaver, they know the old rite of laying by heart.',
    },
    {
      traitId: 'trait.reputation.veil.negative',
      forecastDelta: -0.05,
      factorLine: 'Being a Dangerous Sorcerer, they are not trusted with the guilds\' dead.',
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'warden',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['merchant'],
      supportRole: 'ossuary_guild_warden',
      spawnNpcRole: 'merchant',
      spawnName: 'Orrin Vasse',
    },
  ],
  narrativeTemplates: {
    initiation: 'The dead under a town\'s cathedral will not lie still, and the dean sends for a master to lay '
      + 'them and rule between the guilds.',
    success: 'The dead were laid, and the guilds accepted the ruling.',
    failure: 'The dead were not laid, and the guilds rejected the ruling.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: '{actor} has finished the work under the cathedral, and {location} waits to see if its dead stay '
        + 'quiet.',
      changes: [],
      reactions: [
        {
          id: 'ossuary.credit_the_weavers',
          label: 'Credit the weavers\' sacrifice',
          intent: 'The mortal thanks the weavers, in front of every guild, for giving up their first dead. Their '
            + 'warden will remember it kindly.',
          effects: [
            {
              kind: 'bond_change',
              withAgentId: '$cast:warden',
              sentimentDelta: 0.12,
            },
          ],
        },
        {
          id: 'ossuary.name_the_weavers_refusal',
          label: 'Name the weavers\' refusal',
          intent: 'The mortal tells the town the weavers\' refusal nearly kept the dead restless. The town agrees, '
            + 'and the weavers\' warden will not forget it.',
          effects: [
            {
              kind: 'reputation_with',
              targetLocationId: '$here',
              delta: 0.03,
            },
            {
              kind: 'bond_change',
              withAgentId: '$cast:warden',
              sentimentDelta: -0.12,
            },
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          overview: 'The dead under the cathedral lie quiet, and every guild has put its hand to the ruling. The dean '
            + 'gives {actor} the relic found under the weavers\' bones, in front of all the wardens.',
          changes: [
            {
              id: 'ossuary.crit.the_dead_lie_quiet',
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
              title: 'Well Regarded',
              detail: '{location} thinks well of {actor} now.',
            },
          ],
        },
        success: {
          overview: 'The dead under the cathedral lie quiet. The dean lets {actor} keep the relic found under the '
            + 'weavers\' bones.',
          changes: [
            {
              id: 'ossuary.win.the_dead_lie_quiet',
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
              title: 'Well Regarded',
              detail: '{location} thinks well of {actor} now.',
            },
          ],
        },
        success_at_cost: {
          overview: 'The dead under the cathedral lie quiet, but the weavers have not forgiven the ruling. The dean '
            + 'still gives {actor} the relic found under their bones.',
          changes: [
            {
              id: 'ossuary.cost.the_dead_lie_quiet',
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
              title: 'Well Regarded',
              detail: '{location} thinks well of {actor} now.',
            },
          ],
        },
        failure: {
          overview: 'The dead under the cathedral are still restless, and the guilds have torn up the ruling. {actor} '
            + 'was sent for as a master, and every guild watched the work fail.',
          changes: [
            {
              id: 'ossuary.fail.found_wanting',
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
              title: 'Found Wanting',
              detail: '{location} thinks less of {actor} now.',
            },
          ],
          reactions: [
            {
              id: 'ossuary.fail.keep_watch_unasked',
              label: 'Keep watch unasked',
              intent: 'The mortal keeps watch over the bones one more night, without being asked, and the town notices.',
              effects: [
                {
                  kind: 'reputation_with',
                  targetLocationId: '$here',
                  delta: 0.03,
                },
              ],
            },
            {
              id: 'ossuary.fail.blame_the_weavers_warden',
              label: 'Blame the weavers\' warden',
              intent: 'The mortal tells the dean the weavers\' warden was the trouble from the start, and the warden '
                + 'hears of it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:warden',
                  sentimentDelta: -0.12,
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview: 'The dead under the cathedral are still restless, and the dean has sent {actor} away. Every guild '
            + 'says a master should not have failed so badly.',
          changes: [
            {
              id: 'ossuary.critfail.blamed_for_the_dead',
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
              title: 'Out of Favour',
              detail: '{location} thinks less of {actor} now.',
            },
          ],
          reactions: [
            {
              id: 'ossuary.critfail.keep_watch_unasked',
              label: 'Keep watch unasked',
              intent: 'The mortal keeps watch over the bones one more night, without being asked, and the town notices.',
              effects: [
                {
                  kind: 'reputation_with',
                  targetLocationId: '$here',
                  delta: 0.03,
                },
              ],
            },
            {
              id: 'ossuary.critfail.blame_the_weavers_warden',
              label: 'Blame the weavers\' warden',
              intent: 'The mortal tells the dean the weavers\' warden was the trouble from the start, and the warden '
                + 'hears of it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:warden',
                  sentimentDelta: -0.12,
                },
              ],
            },
          ],
        },
      },
    },
  },
  description: 'A three-step master Veil job in a town: the charnel house under the cathedral is full, the dead '
    + 'in it will not lie still, and every guild wants its own bones kept. The mortal reads which dead '
    + 'are restless and why, says the rite of laying from dusk to dawn, and rules at first light which '
    + 'bones go to new ground, against the weavers\' warden. The night of the laying leaves the town an '
    + 'omen, good or bad. A ruling that holds pays a #relic possession lifted from under the weavers\' '
    + 'first dead and raises the mortal\'s standing with the town; a failed one leaves the town '
    + 'thinking less of the master it sent for by name.',
  locationSubtypes: expandSettings(['urban']),
  consequenceDraw: ['standing', 'omen'],
};

export const RESTLESS_OSSUARY_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
