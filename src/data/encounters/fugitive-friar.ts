/**
 * The Fugitive Friar (slug fugitive-friar) - slot 5 of the master-everyday-3 batch (THR-1840).
 * 
 * Brief: `Docs/plans/encounters/master-everyday-3-brief.md` (slot 5, binding).
 * Pipeline: fugitive-friar-draft / -editorial / -revised / -systems / -final / -package.
 * Model packages (structure only): cathedral-vault, hill-conduit (opt-in complication), guildhall-spy (membership).
 * 
 * plotHookRolled: hook.apotheosis, hook.impossible_choice, hook.sacred_crime
 * plotHookTaken:  hook.sacred_crime (drifted: the crime is the bishop's sentence on a preacher, and the
 *                 master's crime is getting him out). impossible_choice survives as the fork's weight.
 * Seed dice: p3 choice - opposition terrain (indifference), read as the shut town and its watch -
 *            disposition n/a - agentRole bystander_pulled_in - scale settlement - system traits (two variants).
 * 
 * --- Mechanical design block ---
 *   Crux            A friar the bishop condemned hides behind {actor}'s lodgings in a shut town, and asks
 *                   {actor} to get him out before the morning bells.
 *   Shape           Opt-in Complication. Step 0 shadow 0.74 (continue_weakened), then an agent-decided fork
 *                   on courage_prudence: positive (Vanguard) takes him through the water-gate tonight, shadow
 *                   0.80 (the brief's step 2); negative (Watcher) declines the gate and hides him under the
 *                   stable floor through the search, shadow 0.76. Mean 0.77, window fit 0.91.
 *   Consequence hand (binding): possession + membership, no swap.
 *                   possession - attachment_grant reward_tomes_scrolls_prayer_scroll to $actor on every
 *                   success side of both arms: the Prayer Scroll the friar leaves the master.
 *                   membership - membership_change join thieves_guild ($actor, chronicle) on the gate arm's
 *                   success side: the smugglers who use the same water-gate take the master in.
 *   Extras          Hide arm success: bond_change $cast:friar +0.10/+0.08. Failure sides: reputation_with
 *                   $here (-0.03 step 0, -0.07 gate arm, -0.05 hide arm). Reactions: bond_change $cast:friar,
 *                   reputation_with $here.
 *   Cost channels   Bend The Bars is the batch's one Heavy Hand (libraryCardId card.heavy_hand.signature.force):
 *                   essence 0, detectionDelta 0.15, one channel. Every other special prices in essence.
 *                   No rider, no darkness Undertow, no card grants.
 *   Forecast sums   step 0 0.74+0.06+0.06=0.86 - gate 0.80+0.10+0.10=1.00 - hide 0.76+0.10+0.08=0.94.
 *   Cool failure    Nobody is killed, jailed or branded. The friar is taken; the town that trusted the master
 *                   stops trusting them. At critical failure the watch tells the whole town who hid him.
 *   Trait hooks     Gate none. Variants: Scheming (trait.personality.shadow.vice) +0.04, True
 *                   (trait.core.core_integrity.virtue) -0.04. Trait-only nudge none. Trait fragment none.
 *   Systems         cast, items, factions, reputation = 4.
 *   Known caveat    A step-0 critical failure ends the action after the fork pole is recorded, so each arm's
 *                   critical_failure page is read on two routes. Step 0 writes reputation_with $here -0.03 on
 *                   failure and both arms -0.07/-0.05, so the Lost Trust chip is backed on both; the overview
 *                   names no place, so it is true on both.
 *                   A mortal already on the Thieves Guild's rolls gets no new membership (already_member).
 *   Expert collision Shadow on the board: find the coiners, unmask a council spy (masters); raid a tithe barn,
 *                   crack a strongroom (experts). This verb smuggles a person out; it takes nothing.
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
  id: 'encounter.town.fugitive_friar',
  stakes: {
    goal: 'get the condemned friar out of the shut town',
    risk: 'see the friar taken and lose the town\'s trust',
    won: 'got the condemned friar out of the shut town',
    lost: 'saw the friar taken at the water-gate',
    lostBadly: 'was named to the whole town for hiding him',
    arms: {
      negative: {
        won: 'hid the friar until the gates opened',
        lost: 'saw the friar found under the stable floor',
        lostBadly: 'was named to the whole town for hiding him',
      },
    },
  },
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Fugitive Friar',
  reach: 'shadow',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  settings: ['urban'],
  openings: {
    urban: '{actor} has taken lodgings in {location} for the night.',
  },
  steps: [
    {
      reach: 'shadow',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.74,
      purposeLine: 'Find the way out',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The bishop has condemned a friar for preaching against the tithe. The friar escaped his guards. '
        + 'The watch has shut the gates and is searching the town house by house. The friar is hiding in '
        + 'the stable behind {actor}\'s lodgings.\n\n'
        + 'Brother {cast:friar} asks {actor} to get him out before the morning bells. Anyone caught hiding '
        + 'him will lose the town\'s trust. First {actor} must find a way out.',
      criticalSuccessAfterimage: '{actor} found the water-gate under the mill, and learned the hour of every round and the order '
        + 'of the search.',
      successAfterimage: '{actor} found the water-gate under the mill, and learned which streets the watch will search '
        + 'first.',
      successAtCostAfterimage: '{actor} found the water-gate, but asked about it in one tavern too many.',
      failureAfterimage: '{actor} asked in every tavern by the wall, and by midnight had found no gate and learned no '
        + 'rounds. People noticed the questions.',
      criticalFailureAfterimage: '{actor} asked about the water-gate in the wrong tavern. The watch searched the stable that night '
        + 'and took the friar.',
      failureMetadata: {
        effects: [
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: -0.03,
          },
        ],
      },
      deal: {
        count: 4,
        tags: ['shadow', 'insight'],
      },
      nudges: [
        {
          id: 'friar.show_the_way_out',
          name: 'Show The Way Out',
          sphere: 'mind',
          essenceCost: 1,
          forecastDelta: 0.06,
          poleLean: {
            axis: 'courage_prudence',
            toward: 'positive',
          },
          imageTag: 'generic.focus',
          effectLine: 'Fix their mind on exits, so they spot one sooner. They lean toward acting at once.',
          bandProse: {
            critical_success: '{actor} went straight to the mill and found the water-gate in the first hour.',
            success: '{actor} could think only of getting out, and went to look at the water-gate first.',
            near_miss: '{actor} went to the water-gate before they knew the rounds, and nearly walked into the watch '
              + 'there.',
            failure: '{actor} wasted the night looking at the town gates, which the watch held.',
          },
        },
        {
          id: 'friar.slow_the_pulse',
          name: 'Slow The Pulse',
          sphere: 'life',
          essenceCost: 1,
          forecastDelta: 0.06,
          poleLean: {
            axis: 'courage_prudence',
            toward: 'negative',
          },
          imageTag: 'generic.vigor',
          effectLine: 'Calm their heartbeat, so they watch before they move. They lean toward waiting.',
          bandProse: {
            success: '{actor} waited out the first hours and moved only when the street was clear.',
            success_at_cost: '{actor} waited so long to move that half the night was gone before they went looking.',
            failure: '{actor} waited too long for the street to clear, and started asking only after dark.',
            critical_failure: '{actor} waited too long to move the friar, and the watch reached the stable first.',
          },
        },
      ],
    },
    {
      branchOnStep: 0,
      decidedBy: {
        axis: 'courage_prudence',
      },
      variants: {
        positive: {
          reach: 'shadow',
          duration: {
            min: 1,
            max: 2,
          },
          difficulty: 0.8,
          purposeLine: 'Take him through',
          onSuccess: [],
          onFailure: [],
          failBehavior: 'fail_action',
          narrativeTemplate: '{actor} decides to run. They bring the friar by back streets to the mill. The water-gate is '
            + 'closed by a chained iron grating. The stream runs under the wall to the fields. The town\'s '
            + 'smugglers use this gate on dark nights. Sergeant {cast:sergeant} leads two watchmen past it '
            + 'every hour. The friar must be across the fields by the morning bells.',
          criticalSuccessAfterimage: '{actor} had the friar through the grating between two rounds. He was far beyond the wall before '
            + 'dawn.',
          successAfterimage: '{actor} got the grating open, and the friar went through and away before the bells.',
          successAtCostAfterimage: 'The friar got out, but the watch found the grating open on its next round.',
          failureAfterimage: 'The watch reached the water-gate before the friar was through, and took him at the grating. '
            + '{actor} got away in the dark.',
          criticalFailureAfterimage: 'Sergeant {cast:sergeant} took the friar at the grating and saw {actor}\'s face clearly.',
          carryoverFactorLines: {
            critical_success: {
              text: 'They know when the watch passes the water-gate.',
              polarity: 'for',
              forecastDelta: 0.05,
            },
            success: {
              text: 'They know where the water-gate is.',
              polarity: 'for',
              forecastDelta: 0.03,
            },
            success_at_cost: {
              text: 'A tavern noticed their questions about the water-gate.',
              polarity: 'against',
              forecastDelta: -0.02,
            },
            near_miss: {
              text: 'They know the water-gate, but not the watch\'s rounds.',
              polarity: 'for',
              forecastDelta: 0.02,
            },
            failure: {
              text: 'They have no sure way out of the town.',
              polarity: 'against',
              forecastDelta: -0.03,
            },
          },
          successMetadata: {
            effects: [
              {
                kind: 'attachment_grant',
                templateId: 'reward_tomes_scrolls_prayer_scroll',
                targetAgentId: '$actor',
              },
              {
                kind: 'membership_change',
                factionId: 'thieves_guild',
                op: 'join',
                targetAgentId: '$actor',
                chronicle: true,
              },
            ],
          },
          failureMetadata: {
            effects: [
              {
                kind: 'reputation_with',
                targetLocationId: '$here',
                delta: -0.07,
              },
            ],
          },
          deal: {
            count: 4,
            tags: ['shadow', 'peril'],
          },
          nudges: [
            {
              id: 'friar.bend_the_bars',
              libraryCardId: 'card.heavy_hand.signature.force',
              name: 'Bend The Bars',
              sphere: 'force',
              essenceCost: 0,
              forecastDelta: 0.1,
              costs: {
                detectionDelta: 0.15,
              },
              imageTag: 'generic.strength',
              effectLine: 'Twist iron aside with divine strength, so what was locked stands open. Rival gods notice a hand '
                + 'this heavy.',
              bandProse: {
                critical_success: 'The iron bent aside without a sound.',
                success: 'The iron bent easily under {actor}\'s hands.',
                success_at_cost: 'The grating bent with a crack of iron that carried across the town.',
                failure: 'The grating bent open, but the noise of it carried to the watch.',
                critical_failure: 'The grating tore out of the wall, and every watchman on that side of town heard it.',
              },
            },
            {
              id: 'friar.cloud_the_watch',
              name: 'Cloud The Watch',
              sphere: 'darkness',
              essenceCost: 2,
              forecastDelta: 0.1,
              imageTag: 'generic.dark',
              effectLine: 'Dim the sight of anyone standing guard, so those they hunt slip past unseen for an hour.',
              bandProse: {
                success: 'Sergeant {cast:sergeant} looked straight at the water-gate and saw only the stream.',
                near_miss: 'The watchmen looked past the friar, but one heard the splash and turned back.',
                failure: 'The watchmen never saw the friar, but he slipped in the stream and cried out.',
              },
            },
          ],
        },
        negative: {
          reach: 'shadow',
          duration: {
            min: 2,
            max: 3,
          },
          difficulty: 0.76,
          purposeLine: 'Outlast the search',
          onSuccess: [],
          onFailure: [],
          failBehavior: 'fail_action',
          narrativeTemplate: '{actor} decides not to run. They hide the friar under the stable floor until the gates open '
            + 'again. Sergeant {cast:sergeant} and the watch are searching every house in the street. The '
            + 'watchmen open every door and knock on every floor to hear if it is hollow. The friar must not be '
            + 'found.',
          criticalSuccessAfterimage: 'Sergeant {cast:sergeant} searched the stable in person and did not find the friar. When the '
            + 'gates opened, the friar walked out with the carters.',
          successAfterimage: 'The search passed the stable twice and missed the friar. When the gates opened, he left with the '
            + 'carters.',
          successAtCostAfterimage: 'The search missed the friar, but he lay under the floor for most of a week and fell sick.',
          failureAfterimage: 'On the second day the watch searched the stable again and found the friar under the floor.',
          criticalFailureAfterimage: 'The watch dragged the friar out of the stable in front of the whole street.',
          carryoverFactorLines: {
            critical_success: {
              text: 'They know where the watch will search, and when.',
              polarity: 'for',
              forecastDelta: 0.05,
            },
            success: {
              text: 'They know which streets the watch will search first.',
              polarity: 'for',
              forecastDelta: 0.03,
            },
            success_at_cost: {
              text: 'A tavern noticed the questions they asked.',
              polarity: 'against',
              forecastDelta: -0.02,
            },
            near_miss: {
              text: 'They know some of the watch\'s rounds.',
              polarity: 'for',
              forecastDelta: 0.02,
            },
            failure: {
              text: 'They do not know when the search will come.',
              polarity: 'against',
              forecastDelta: -0.03,
            },
          },
          successMetadata: {
            effects: [
              {
                kind: 'attachment_grant',
                templateId: 'reward_tomes_scrolls_prayer_scroll',
                targetAgentId: '$actor',
              },
              {
                kind: 'bond_change',
                withAgentId: '$cast:friar',
                sentimentDelta: 0.1,
                trustDelta: 0.08,
              },
            ],
          },
          failureMetadata: {
            effects: [
              {
                kind: 'reputation_with',
                targetLocationId: '$here',
                delta: -0.05,
              },
            ],
          },
          deal: {
            count: 4,
            tags: ['shadow', 'social'],
          },
          nudges: [
            {
              id: 'friar.stretch_the_hunt',
              name: 'Stretch The Hunt',
              sphere: 'time',
              essenceCost: 2,
              forecastDelta: 0.1,
              imageTag: 'generic.memory',
              effectLine: 'Make every hour of a search run long, so the searchers tire and grow careless.',
              bandProse: {
                success: 'The search dragged on house by house, and the watchmen were tired and careless by the time they '
                  + 'reached the stable.',
                success_at_cost: 'The search dragged on so long that the watch came back to the street a second time.',
                near_miss: 'The search slowed, but one watchman came back to the stable alone that night to look again.',
                failure: 'The search dragged, but Sergeant {cast:sergeant} kept the watch at it until every floor in the '
                  + 'street was tested.',
              },
            },
            {
              id: 'friar.thicken_the_floor',
              name: 'Thicken The Floor',
              sphere: 'matter',
              essenceCost: 2,
              forecastDelta: 0.08,
              imageTag: 'generic.matter',
              effectLine: 'Make hollow wood and stone sound solid when struck, so what lies beneath stays hidden.',
              bandProse: {
                critical_success: 'The sergeant stamped on the boards over the friar, heard solid wood, and moved on.',
                success: 'The watch knocked on the stable floor and heard only solid boards.',
                failure: 'The boards sounded solid, but the friar coughed under them.',
                critical_failure: 'The boards rang solid everywhere but one place, and the watch tore it up.',
              },
            },
          ],
        },
      },
      fallback: {
        reach: 'shadow',
        duration: {
          min: 2,
          max: 3,
        },
        difficulty: 0.76,
        purposeLine: 'Outlast the search',
        onSuccess: [],
        onFailure: [],
        failBehavior: 'fail_action',
        narrativeTemplate: '{actor} decides not to run. They hide the friar under the stable floor until the gates open '
          + 'again. Sergeant {cast:sergeant} and the watch are searching every house in the street. The '
          + 'watchmen open every door and knock on every floor to hear if it is hollow. The friar must not be '
          + 'found.',
        criticalSuccessAfterimage: 'Sergeant {cast:sergeant} searched the stable in person and did not find the friar. When the '
          + 'gates opened, the friar walked out with the carters.',
        successAfterimage: 'The search passed the stable twice and missed the friar. When the gates opened, he left with the '
          + 'carters.',
        successAtCostAfterimage: 'The search missed the friar, but he lay under the floor for most of a week and fell sick.',
        failureAfterimage: 'On the second day the watch searched the stable again and found the friar under the floor.',
        criticalFailureAfterimage: 'The watch dragged the friar out of the stable in front of the whole street.',
        carryoverFactorLines: {
          critical_success: {
            text: 'They know where the watch will search, and when.',
            polarity: 'for',
            forecastDelta: 0.05,
          },
          success: {
            text: 'They know which streets the watch will search first.',
            polarity: 'for',
            forecastDelta: 0.03,
          },
          success_at_cost: {
            text: 'A tavern noticed the questions they asked.',
            polarity: 'against',
            forecastDelta: -0.02,
          },
          near_miss: {
            text: 'They know some of the watch\'s rounds.',
            polarity: 'for',
            forecastDelta: 0.02,
          },
          failure: {
            text: 'They do not know when the search will come.',
            polarity: 'against',
            forecastDelta: -0.03,
          },
        },
        successMetadata: {
          effects: [
            {
              kind: 'attachment_grant',
              templateId: 'reward_tomes_scrolls_prayer_scroll',
              targetAgentId: '$actor',
            },
            {
              kind: 'bond_change',
              withAgentId: '$cast:friar',
              sentimentDelta: 0.1,
              trustDelta: 0.08,
            },
          ],
        },
        failureMetadata: {
          effects: [
            {
              kind: 'reputation_with',
              targetLocationId: '$here',
              delta: -0.05,
            },
          ],
        },
        deal: {
          count: 4,
          tags: ['shadow', 'social'],
        },
        nudges: [
          {
            id: 'friar.stretch_the_hunt',
            name: 'Stretch The Hunt',
            sphere: 'time',
            essenceCost: 2,
            forecastDelta: 0.1,
            imageTag: 'generic.memory',
            effectLine: 'Make every hour of a search run long, so the searchers tire and grow careless.',
            bandProse: {
              success: 'The search dragged on house by house, and the watchmen were tired and careless by the time they '
                + 'reached the stable.',
              success_at_cost: 'The search dragged on so long that the watch came back to the street a second time.',
              near_miss: 'The search slowed, but one watchman came back to the stable alone that night to look again.',
              failure: 'The search dragged, but Sergeant {cast:sergeant} kept the watch at it until every floor in the '
                + 'street was tested.',
            },
          },
          {
            id: 'friar.thicken_the_floor',
            name: 'Thicken The Floor',
            sphere: 'matter',
            essenceCost: 2,
            forecastDelta: 0.08,
            imageTag: 'generic.matter',
            effectLine: 'Make hollow wood and stone sound solid when struck, so what lies beneath stays hidden.',
            bandProse: {
              critical_success: 'The sergeant stamped on the boards over the friar, heard solid wood, and moved on.',
              success: 'The watch knocked on the stable floor and heard only solid boards.',
              failure: 'The boards sounded solid, but the friar coughed under them.',
              critical_failure: 'The boards rang solid everywhere but one place, and the watch tore it up.',
            },
          },
        ],
      },
    },
  ],
  traitVariants: [
    {
      traitId: 'trait.personality.shadow.vice',
      forecastDelta: 0.04,
      factorLine: 'Being Scheming, they think like the men hunting the friar.',
    },
    {
      traitId: 'trait.core.core_integrity.virtue',
      forecastDelta: -0.04,
      factorLine: 'Being True, they cannot lie easily to the watch.',
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'friar',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      supportRole: 'fugitive_friar',
      spawnNpcRole: 'monk',
      spawnName: 'Wendel Ashby',
    },
    {
      kind: 'actor',
      key: 'sergeant',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['guard'],
      supportRole: 'watch_sergeant',
      spawnNpcRole: 'guard',
      spawnName: 'Rolf Hagen',
    },
  ],
  narrativeTemplates: {
    initiation: 'A friar the bishop condemned is hiding behind {actor}\'s lodgings in {location}, and asks to be '
      + 'got out of the shut town.',
    success: 'The condemned friar got out of {location}.',
    failure: 'The bishop\'s watch took the condemned friar in {location}.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      positive: {
        overview: '{actor} took the friar to the water-gate.',
        changes: [],
        byOutcome: {
          critical_success: {
            overview: 'Brother {cast:friar} is free, and the watch does not know how he left. The smugglers who use the '
              + 'water-gate saw who got him out.',
            changes: [
              {
                id: 'friar.gate.crit.scroll',
                kind: 'item',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'Prayer Scroll',
                detail: 'Brother {cast:friar}\'s parting gift to {actor}.',
                stateNoun: {
                  text: 'Prayer Scroll',
                  entityId: 'reward_tomes_scrolls_prayer_scroll',
                  visualKind: 'attachment',
                },
                concepts: [
                  {
                    text: 'Prayer Scroll',
                    entityId: 'reward_tomes_scrolls_prayer_scroll',
                    visualKind: 'attachment',
                  },
                ],
              },
              {
                id: 'friar.gate.crit.guild',
                kind: 'faction_reputation',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'Taken In',
                detail: 'The Thieves Guild has put {actor} on its rolls.',
                stateNoun: {
                  text: 'a membership',
                  entityId: '$faction:thieves_guild',
                  visualKind: 'faction',
                  tooltipId: 'ui.faction_member',
                },
                concepts: [
                  {
                    text: 'the Thieves Guild',
                    entityId: '$faction:thieves_guild',
                    visualKind: 'faction',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'friar.gate.crit.keep_preaching',
                label: 'Ask Him To Keep Preaching',
                intent: '{actor} backs his cause, and he knows it.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: 0.1,
                    trustDelta: 0.08,
                  },
                ],
              },
              {
                id: 'friar.gate.crit.preach_elsewhere',
                label: 'Ask Him To Preach Elsewhere',
                intent: '{actor} wants no more trouble between the town and the bishop.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: -0.06,
                  },
                  {
                    kind: 'reputation_with',
                    targetLocationId: '$here',
                    delta: 0.03,
                  },
                ],
              },
            ],
          },
          success: {
            overview: 'Brother {cast:friar} is out of the town and on the road. The smugglers who use the water-gate '
              + 'saw who got him out.',
            changes: [
              {
                id: 'friar.gate.win.scroll',
                kind: 'item',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'Prayer Scroll',
                detail: 'Brother {cast:friar}\'s parting gift to {actor}.',
                stateNoun: {
                  text: 'Prayer Scroll',
                  entityId: 'reward_tomes_scrolls_prayer_scroll',
                  visualKind: 'attachment',
                },
                concepts: [
                  {
                    text: 'Prayer Scroll',
                    entityId: 'reward_tomes_scrolls_prayer_scroll',
                    visualKind: 'attachment',
                  },
                ],
              },
              {
                id: 'friar.gate.win.guild',
                kind: 'faction_reputation',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'Taken In',
                detail: 'The Thieves Guild has put {actor} on its rolls.',
                stateNoun: {
                  text: 'a membership',
                  entityId: '$faction:thieves_guild',
                  visualKind: 'faction',
                  tooltipId: 'ui.faction_member',
                },
                concepts: [
                  {
                    text: 'the Thieves Guild',
                    entityId: '$faction:thieves_guild',
                    visualKind: 'faction',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'friar.gate.win.keep_preaching',
                label: 'Ask Him To Keep Preaching',
                intent: '{actor} backs his cause, and he knows it.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: 0.1,
                    trustDelta: 0.08,
                  },
                ],
              },
              {
                id: 'friar.gate.win.preach_elsewhere',
                label: 'Ask Him To Preach Elsewhere',
                intent: '{actor} wants no more trouble between the town and the bishop.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: -0.06,
                  },
                  {
                    kind: 'reputation_with',
                    targetLocationId: '$here',
                    delta: 0.03,
                  },
                ],
              },
            ],
          },
          success_at_cost: {
            overview: 'Brother {cast:friar} is out of the town, after a night that went worse than {actor} planned. The '
              + 'smugglers who use the water-gate saw who got him out.',
            changes: [
              {
                id: 'friar.gate.cost.scroll',
                kind: 'item',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'Prayer Scroll',
                detail: 'Brother {cast:friar}\'s parting gift to {actor}.',
                stateNoun: {
                  text: 'Prayer Scroll',
                  entityId: 'reward_tomes_scrolls_prayer_scroll',
                  visualKind: 'attachment',
                },
                concepts: [
                  {
                    text: 'Prayer Scroll',
                    entityId: 'reward_tomes_scrolls_prayer_scroll',
                    visualKind: 'attachment',
                  },
                ],
              },
              {
                id: 'friar.gate.cost.guild',
                kind: 'faction_reputation',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'Taken In',
                detail: 'The Thieves Guild has put {actor} on its rolls.',
                stateNoun: {
                  text: 'a membership',
                  entityId: '$faction:thieves_guild',
                  visualKind: 'faction',
                  tooltipId: 'ui.faction_member',
                },
                concepts: [
                  {
                    text: 'the Thieves Guild',
                    entityId: '$faction:thieves_guild',
                    visualKind: 'faction',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'friar.gate.cost.keep_preaching',
                label: 'Ask Him To Keep Preaching',
                intent: '{actor} backs his cause, and he knows it.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: 0.1,
                    trustDelta: 0.08,
                  },
                ],
              },
              {
                id: 'friar.gate.cost.preach_elsewhere',
                label: 'Ask Him To Preach Elsewhere',
                intent: '{actor} wants no more trouble between the town and the bishop.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: -0.06,
                  },
                  {
                    kind: 'reputation_with',
                    targetLocationId: '$here',
                    delta: 0.03,
                  },
                ],
              },
            ],
          },
          failure: {
            overview: 'Brother {cast:friar} is in the bishop\'s cells, and the watch knows whose stable he hid in.',
            changes: [
              {
                id: 'friar.gate.fail.trust',
                kind: 'reputation',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'Lost Trust',
                detail: '{location} trusts {actor} less.',
                stateNoun: {
                  text: 'reputation with {target}',
                  entityId: '$here',
                  visualKind: 'location',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: '{location}',
                    entityId: '$here',
                    visualKind: 'location',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'friar.gate.fail.speak_up',
                label: 'Speak Up For Him',
                intent: '{actor} says openly that he was wronged, and the town hears it.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: 0.08,
                  },
                  {
                    kind: 'reputation_with',
                    targetLocationId: '$here',
                    delta: -0.03,
                  },
                ],
              },
              {
                id: 'friar.gate.fail.keep_clear',
                label: 'Keep Clear Of Him',
                intent: '{actor} lets the friar face the bishop alone.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: -0.1,
                  },
                ],
              },
            ],
          },
          critical_failure: {
            overview: 'Brother {cast:friar} is in the bishop\'s cells, and the watch has told the whole town that '
              + '{actor} hid him.',
            changes: [
              {
                id: 'friar.gate.critfail.trust',
                kind: 'reputation',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'Lost Trust',
                detail: '{location} trusts {actor} less.',
                stateNoun: {
                  text: 'reputation with {target}',
                  entityId: '$here',
                  visualKind: 'location',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: '{location}',
                    entityId: '$here',
                    visualKind: 'location',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'friar.gate.critfail.speak_up',
                label: 'Speak Up For Him',
                intent: '{actor} says openly that he was wronged, and the town hears it.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: 0.08,
                  },
                  {
                    kind: 'reputation_with',
                    targetLocationId: '$here',
                    delta: -0.03,
                  },
                ],
              },
              {
                id: 'friar.gate.critfail.keep_clear',
                label: 'Keep Clear Of Him',
                intent: '{actor} lets the friar face the bishop alone.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: -0.1,
                  },
                ],
              },
            ],
          },
        },
      },
      negative: {
        overview: '{actor} hid the friar under the stable floor.',
        changes: [],
        byOutcome: {
          critical_success: {
            overview: 'Brother {cast:friar} is free, and the sergeant who searched the stable never knew he was there.',
            changes: [
              {
                id: 'friar.hide.crit.scroll',
                kind: 'item',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'Prayer Scroll',
                detail: 'Brother {cast:friar}\'s parting gift to {actor}.',
                stateNoun: {
                  text: 'Prayer Scroll',
                  entityId: 'reward_tomes_scrolls_prayer_scroll',
                  visualKind: 'attachment',
                },
                concepts: [
                  {
                    text: 'Prayer Scroll',
                    entityId: 'reward_tomes_scrolls_prayer_scroll',
                    visualKind: 'attachment',
                  },
                ],
              },
              {
                id: 'friar.hide.crit.friar',
                kind: 'reputation',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'The Friar\'s Trust',
                detail: 'Brother {cast:friar} trusts {actor} now.',
                stateNoun: {
                  text: 'reputation with {target}',
                  entityId: '$cast:friar',
                  visualKind: 'agent',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: '{cast:friar}',
                    entityId: '$cast:friar',
                    visualKind: 'agent',
                  },
                ],
                causeClause: 'Kept him hidden',
              },
            ],
            reactions: [
              {
                id: 'friar.hide.crit.keep_preaching',
                label: 'Ask Him To Keep Preaching',
                intent: '{actor} backs his cause, and he knows it.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: 0.1,
                    trustDelta: 0.08,
                  },
                ],
              },
              {
                id: 'friar.hide.crit.preach_elsewhere',
                label: 'Ask Him To Preach Elsewhere',
                intent: '{actor} wants no more trouble between the town and the bishop.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: -0.06,
                  },
                  {
                    kind: 'reputation_with',
                    targetLocationId: '$here',
                    delta: 0.03,
                  },
                ],
              },
            ],
          },
          success: {
            overview: 'Brother {cast:friar} is on the road, and the street never learned he was there.',
            changes: [
              {
                id: 'friar.hide.win.scroll',
                kind: 'item',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'Prayer Scroll',
                detail: 'Brother {cast:friar}\'s parting gift to {actor}.',
                stateNoun: {
                  text: 'Prayer Scroll',
                  entityId: 'reward_tomes_scrolls_prayer_scroll',
                  visualKind: 'attachment',
                },
                concepts: [
                  {
                    text: 'Prayer Scroll',
                    entityId: 'reward_tomes_scrolls_prayer_scroll',
                    visualKind: 'attachment',
                  },
                ],
              },
              {
                id: 'friar.hide.win.friar',
                kind: 'reputation',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'The Friar\'s Trust',
                detail: 'Brother {cast:friar} trusts {actor} now.',
                stateNoun: {
                  text: 'reputation with {target}',
                  entityId: '$cast:friar',
                  visualKind: 'agent',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: '{cast:friar}',
                    entityId: '$cast:friar',
                    visualKind: 'agent',
                  },
                ],
                causeClause: 'Kept him hidden',
              },
            ],
            reactions: [
              {
                id: 'friar.hide.win.keep_preaching',
                label: 'Ask Him To Keep Preaching',
                intent: '{actor} backs his cause, and he knows it.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: 0.1,
                    trustDelta: 0.08,
                  },
                ],
              },
              {
                id: 'friar.hide.win.preach_elsewhere',
                label: 'Ask Him To Preach Elsewhere',
                intent: '{actor} wants no more trouble between the town and the bishop.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: -0.06,
                  },
                  {
                    kind: 'reputation_with',
                    targetLocationId: '$here',
                    delta: 0.03,
                  },
                ],
              },
            ],
          },
          success_at_cost: {
            overview: 'Brother {cast:friar} is out of the town, after a search that came closer than {actor} wanted.',
            changes: [
              {
                id: 'friar.hide.cost.scroll',
                kind: 'item',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'Prayer Scroll',
                detail: 'Brother {cast:friar}\'s parting gift to {actor}.',
                stateNoun: {
                  text: 'Prayer Scroll',
                  entityId: 'reward_tomes_scrolls_prayer_scroll',
                  visualKind: 'attachment',
                },
                concepts: [
                  {
                    text: 'Prayer Scroll',
                    entityId: 'reward_tomes_scrolls_prayer_scroll',
                    visualKind: 'attachment',
                  },
                ],
              },
              {
                id: 'friar.hide.cost.friar',
                kind: 'reputation',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'The Friar\'s Trust',
                detail: 'Brother {cast:friar} trusts {actor} now.',
                stateNoun: {
                  text: 'reputation with {target}',
                  entityId: '$cast:friar',
                  visualKind: 'agent',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: '{cast:friar}',
                    entityId: '$cast:friar',
                    visualKind: 'agent',
                  },
                ],
                causeClause: 'Kept him hidden',
              },
            ],
            reactions: [
              {
                id: 'friar.hide.cost.keep_preaching',
                label: 'Ask Him To Keep Preaching',
                intent: '{actor} backs his cause, and he knows it.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: 0.1,
                    trustDelta: 0.08,
                  },
                ],
              },
              {
                id: 'friar.hide.cost.preach_elsewhere',
                label: 'Ask Him To Preach Elsewhere',
                intent: '{actor} wants no more trouble between the town and the bishop.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: -0.06,
                  },
                  {
                    kind: 'reputation_with',
                    targetLocationId: '$here',
                    delta: 0.03,
                  },
                ],
              },
            ],
          },
          failure: {
            overview: 'Brother {cast:friar} is in the bishop\'s cells, and the street knows who hid him.',
            changes: [
              {
                id: 'friar.hide.fail.trust',
                kind: 'reputation',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'Lost Trust',
                detail: '{location} trusts {actor} less.',
                stateNoun: {
                  text: 'reputation with {target}',
                  entityId: '$here',
                  visualKind: 'location',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: '{location}',
                    entityId: '$here',
                    visualKind: 'location',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'friar.hide.fail.speak_up',
                label: 'Speak Up For Him',
                intent: '{actor} says openly that he was wronged, and the town hears it.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: 0.08,
                  },
                  {
                    kind: 'reputation_with',
                    targetLocationId: '$here',
                    delta: -0.03,
                  },
                ],
              },
              {
                id: 'friar.hide.fail.keep_clear',
                label: 'Keep Clear Of Him',
                intent: '{actor} lets the friar face the bishop alone.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: -0.1,
                  },
                ],
              },
            ],
          },
          critical_failure: {
            overview: 'Brother {cast:friar} is in the bishop\'s cells, and the watch has told the whole town that '
              + '{actor} hid him.',
            changes: [
              {
                id: 'friar.hide.critfail.trust',
                kind: 'reputation',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'Lost Trust',
                detail: '{location} trusts {actor} less.',
                stateNoun: {
                  text: 'reputation with {target}',
                  entityId: '$here',
                  visualKind: 'location',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: '{location}',
                    entityId: '$here',
                    visualKind: 'location',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'friar.hide.critfail.speak_up',
                label: 'Speak Up For Him',
                intent: '{actor} says openly that he was wronged, and the town hears it.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: 0.08,
                  },
                  {
                    kind: 'reputation_with',
                    targetLocationId: '$here',
                    delta: -0.03,
                  },
                ],
              },
              {
                id: 'friar.hide.critfail.keep_clear',
                label: 'Keep Clear Of Him',
                intent: '{actor} lets the friar face the bishop alone.',
                effects: [
                  {
                    kind: 'bond_change',
                    withAgentId: '$cast:friar',
                    sentimentDelta: -0.1,
                  },
                ],
              },
            ],
          },
        },
      },
    },
    fallback: {
      overview: '{actor} hid the friar under the stable floor.',
      changes: [],
      byOutcome: {
        critical_success: {
          overview: 'Brother {cast:friar} is free, and the sergeant who searched the stable never knew he was there.',
          changes: [
            {
              id: 'friar.fb.crit.scroll',
              kind: 'item',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'Prayer Scroll',
              detail: 'Brother {cast:friar}\'s parting gift to {actor}.',
              stateNoun: {
                text: 'Prayer Scroll',
                entityId: 'reward_tomes_scrolls_prayer_scroll',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'Prayer Scroll',
                  entityId: 'reward_tomes_scrolls_prayer_scroll',
                  visualKind: 'attachment',
                },
              ],
            },
            {
              id: 'friar.fb.crit.friar',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Friar\'s Trust',
              detail: 'Brother {cast:friar} trusts {actor} now.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:friar',
                visualKind: 'agent',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{cast:friar}',
                  entityId: '$cast:friar',
                  visualKind: 'agent',
                },
              ],
              causeClause: 'Kept him hidden',
            },
          ],
          reactions: [
            {
              id: 'friar.fb.crit.keep_preaching',
              label: 'Ask Him To Keep Preaching',
              intent: '{actor} backs his cause, and he knows it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:friar',
                  sentimentDelta: 0.1,
                  trustDelta: 0.08,
                },
              ],
            },
            {
              id: 'friar.fb.crit.preach_elsewhere',
              label: 'Ask Him To Preach Elsewhere',
              intent: '{actor} wants no more trouble between the town and the bishop.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:friar',
                  sentimentDelta: -0.06,
                },
                {
                  kind: 'reputation_with',
                  targetLocationId: '$here',
                  delta: 0.03,
                },
              ],
            },
          ],
        },
        success: {
          overview: 'Brother {cast:friar} is on the road, and the street never learned he was there.',
          changes: [
            {
              id: 'friar.fb.win.scroll',
              kind: 'item',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'Prayer Scroll',
              detail: 'Brother {cast:friar}\'s parting gift to {actor}.',
              stateNoun: {
                text: 'Prayer Scroll',
                entityId: 'reward_tomes_scrolls_prayer_scroll',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'Prayer Scroll',
                  entityId: 'reward_tomes_scrolls_prayer_scroll',
                  visualKind: 'attachment',
                },
              ],
            },
            {
              id: 'friar.fb.win.friar',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Friar\'s Trust',
              detail: 'Brother {cast:friar} trusts {actor} now.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:friar',
                visualKind: 'agent',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{cast:friar}',
                  entityId: '$cast:friar',
                  visualKind: 'agent',
                },
              ],
              causeClause: 'Kept him hidden',
            },
          ],
          reactions: [
            {
              id: 'friar.fb.win.keep_preaching',
              label: 'Ask Him To Keep Preaching',
              intent: '{actor} backs his cause, and he knows it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:friar',
                  sentimentDelta: 0.1,
                  trustDelta: 0.08,
                },
              ],
            },
            {
              id: 'friar.fb.win.preach_elsewhere',
              label: 'Ask Him To Preach Elsewhere',
              intent: '{actor} wants no more trouble between the town and the bishop.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:friar',
                  sentimentDelta: -0.06,
                },
                {
                  kind: 'reputation_with',
                  targetLocationId: '$here',
                  delta: 0.03,
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview: 'Brother {cast:friar} is out of the town, after a search that came closer than {actor} wanted.',
          changes: [
            {
              id: 'friar.fb.cost.scroll',
              kind: 'item',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'Prayer Scroll',
              detail: 'Brother {cast:friar}\'s parting gift to {actor}.',
              stateNoun: {
                text: 'Prayer Scroll',
                entityId: 'reward_tomes_scrolls_prayer_scroll',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'Prayer Scroll',
                  entityId: 'reward_tomes_scrolls_prayer_scroll',
                  visualKind: 'attachment',
                },
              ],
            },
            {
              id: 'friar.fb.cost.friar',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Friar\'s Trust',
              detail: 'Brother {cast:friar} trusts {actor} now.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:friar',
                visualKind: 'agent',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{cast:friar}',
                  entityId: '$cast:friar',
                  visualKind: 'agent',
                },
              ],
              causeClause: 'Kept him hidden',
            },
          ],
          reactions: [
            {
              id: 'friar.fb.cost.keep_preaching',
              label: 'Ask Him To Keep Preaching',
              intent: '{actor} backs his cause, and he knows it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:friar',
                  sentimentDelta: 0.1,
                  trustDelta: 0.08,
                },
              ],
            },
            {
              id: 'friar.fb.cost.preach_elsewhere',
              label: 'Ask Him To Preach Elsewhere',
              intent: '{actor} wants no more trouble between the town and the bishop.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:friar',
                  sentimentDelta: -0.06,
                },
                {
                  kind: 'reputation_with',
                  targetLocationId: '$here',
                  delta: 0.03,
                },
              ],
            },
          ],
        },
        failure: {
          overview: 'Brother {cast:friar} is in the bishop\'s cells, and the street knows who hid him.',
          changes: [
            {
              id: 'friar.fb.fail.trust',
              kind: 'reputation',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Lost Trust',
              detail: '{location} trusts {actor} less.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$here',
                visualKind: 'location',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{location}',
                  entityId: '$here',
                  visualKind: 'location',
                },
              ],
            },
          ],
          reactions: [
            {
              id: 'friar.fb.fail.speak_up',
              label: 'Speak Up For Him',
              intent: '{actor} says openly that he was wronged, and the town hears it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:friar',
                  sentimentDelta: 0.08,
                },
                {
                  kind: 'reputation_with',
                  targetLocationId: '$here',
                  delta: -0.03,
                },
              ],
            },
            {
              id: 'friar.fb.fail.keep_clear',
              label: 'Keep Clear Of Him',
              intent: '{actor} lets the friar face the bishop alone.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:friar',
                  sentimentDelta: -0.1,
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview: 'Brother {cast:friar} is in the bishop\'s cells, and the watch has told the whole town that '
            + '{actor} hid him.',
          changes: [
            {
              id: 'friar.fb.critfail.trust',
              kind: 'reputation',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Lost Trust',
              detail: '{location} trusts {actor} less.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$here',
                visualKind: 'location',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{location}',
                  entityId: '$here',
                  visualKind: 'location',
                },
              ],
            },
          ],
          reactions: [
            {
              id: 'friar.fb.critfail.speak_up',
              label: 'Speak Up For Him',
              intent: '{actor} says openly that he was wronged, and the town hears it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:friar',
                  sentimentDelta: 0.08,
                },
                {
                  kind: 'reputation_with',
                  targetLocationId: '$here',
                  delta: -0.03,
                },
              ],
            },
            {
              id: 'friar.fb.critfail.keep_clear',
              label: 'Keep Clear Of Him',
              intent: '{actor} lets the friar face the bishop alone.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:friar',
                  sentimentDelta: -0.1,
                },
              ],
            },
          ],
        },
      },
    },
  },
  description: 'A friar the bishop condemned for preaching is hiding in a stable while the watch searches the '
    + 'shut town house by house. Someone has to find a way out and get him through it before the '
    + 'morning bells, or keep him hidden until the gates open.',
  locationSubtypes: expandSettings(['urban']),
  consequenceDraw: ['possession', 'membership'],
};

export const FUGITIVE_FRIAR_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
