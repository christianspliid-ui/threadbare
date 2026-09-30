/**
 * The Debt Arbitration — slot 1 of the expert-everyday-1 batch (THR-1678).
 * 
 * Brief: `Docs/plans/encounters/expert-everyday-1-brief.md` (slot 1, binding).
 * Pipeline: debt-arbitration-draft / -editorial (PASS WITH REVISIONS) / -revised /
 *           -systems (READY WITH CAVEATS) / -final / -package (PACKAGE PASS, connected).
 * 
 * plotHookRolled: hook.builders_dilemma, hook.unlikely_alliance, hook.puzzle_gauntlet
 * plotHookTaken:  hook.puzzle_gauntlet, blended with hook.unlikely_alliance. The
 *                 house's founders built an arbitration that, once called, runs to a
 *                 ruling that binds every claim, and it still works. The alliance
 *                 lives in a reaction: the mortal may sell the noble silence about
 *                 the household's unpaid loans (a favour owed). builders_dilemma set
 *                 aside (a half-built work would overload P2).
 * 
 * Rolled constraints (brief, binding): reach gold · steps gold 0.58 -> gold 0.66 ·
 * settings urban · shape opt-in complication · consequence hand possession +
 * knowledge · p3Shape contest · opposition uncanny (its own law) read as the house's
 * own custom, no magic · disposition hostile (the master) · agentRole client who is
 * owed · scale settlement · system target carryover (THR-892) · rarityTier 2 · scale
 * local · intrinsicTier shaping (brief: background's 0.45 open-draw cap cannot carry
 * expert difficulty).
 * 
 * ─── Mechanical design block (designed before the prose) ─────────────
 *   Crux            A banking house will not pay {actor}'s bill in full, and the only
 *                   way to be paid in full is an arbitration that must run to a ruling,
 *                   against a noble who wants the same pledge.
 *   Whose problem?  The agent's: they hold the bill. The bill is scene-local — the
 *                   reason they arrived, settled inside the encounter, asserting no
 *                   prior tie to any graph agent (prose rule 7).
 *   Reach = theme?  Step 0 Gold 0.58 prices the offer against the deed. Step 1 Gold on
 *                   both arms: the arbitration (0.66) ranks a bill against a larger
 *                   claim from the books; the exit (0.30) sees a full third counted.
 *   Shape           Opt-in Complication. Step 0 is taken by every mortal, then an
 *                   agent-decided fork on courage_prudence: Vanguard (positive) calls
 *                   the arbitration; Watcher (negative) takes the third. The two step-0
 *                   specials carry opposite pole leans; the player never picks.
 *   Carryover       Step 0 continue_weakened; both arms author carryoverFactorLines
 *                   keyed on step 0 (critical_failure rows omitted: a step-0 critical
 *                   failure ends the action).
 *   Consequence hand (binding, THR-1145): possession + knowledge — no swap.
 *     possession    Vanguard successMetadata.rewardPool { possession: 1, #gold }: the
 *                   elders pay the ruled bill in goods from the warehouses; tier by band;
 *                   engine-rendered PRIZE chip.
 *     knowledge     `intelligence` (political_secret) on BOTH Vanguard halves: the books,
 *                   read aloud, show the house lent most of its money to the noble's
 *                   household. BOON chip on every Vanguard band.
 *   Extras          reputation_with $here +0.10 / -0.12 (Vanguard), -0.05 (Watcher
 *                   failure); favor_creation debtor $cast:master (Watcher success);
 *                   reactions: favour from $cast:claimant, or tell the town.
 *   Cool failure?   Nobody is hurt, jailed or branded. A lost ruling costs the bill and
 *                   the town's trust in the mortal's judgement with money; the mortal
 *                   still leaves knowing who emptied the bank.
 *   Trait hooks     Gate: none. Variant: Greedy (trait.personality.gold.vice) +0.04.
 *                   Trait-only nudge: none. Trait fragment: none.
 *   Systems quota   cast + rewards + reputation + favours — four.
 *   Heavy Hand      none. Specials: Stoke The Grievance (Kindled Ambition, spirit),
 *                   Plant Patience (Whisper, mind), Scatter The Figures (Stumble,
 *                   chaos, opposes claimant), Invoke The Rule (Signature, order). No
 *                   libraryCardId bound. Watcher arm is deal-only.
 * 
 * ─── The narrator's 12 questions, answered ───────────────────────────
 *   1 P1 arrival?      {actor} arrives in {location} to cash a bill of exchange at its
 *                      oldest banking house. Graph names only.
 *   2 P2 events?       The house has stopped paying; the master offers a third; three
 *                      merchants have taken it. Costs already paid.
 *   3 P3 one stake?    Contest: a noble with the largest claim wants the house's last
 *                      pledge; the arbitration runs to a ruling and the loser forfeits.
 *   4 ≤80 words?       Opening + step-0 spine: 78.
 *   5 Read aloud?      Every sentence is a report.
 *   6 Stated?          The rule, the forfeit and the stake are stated, not implied.
 *   7 Every sentence works? Challenge, test or outcome.
 *   8 Nothing unintroduced? Master, noble, deed, rule and arbitration appear before a
 *                      card or chip names them; the elders in the Vanguard spine.
 *   9 One named person? Step 0 {cast:master}; Vanguard {cast:claimant}; Watcher
 *                      {cast:master}.
 *  10 Stake in a sentence? 'Take a third, or call an arbitration against a noble for
 *                      the house's last pledge and forfeit the bill if it is lost.'
 *  11 Cards verb+noun? Yes; no name word repeated in its effect line; no digits.
 *  12 Opening per class? urban, the only class, written.
 * 
 * ─── Known caveat (systems pass) ─────────────────────────────────────
 *   A step-0 critical_failure ends the action after the fork pole is recorded, so the
 *   chosen arm's critical_failure page renders chips whose writes never fired. Corpus-
 *   wide engine gap (same in fair-bout and counting-house-dispute); see
 *   debt-arbitration-systems.md § 9. Rare at 0.58 for an expert.
 *   Measurement: the fork carries no top-level difficulty, so measure:roll-spread reads
 *   step 0 only (0.58, window fit 0.72, inside the expert band).
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
  id: 'encounter.town.debt_arbitration',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Debt Arbitration',
  reach: 'gold',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  settings: ['urban'],
  openings: {
    urban: '{actor} arrives in {location} to cash a bill of exchange at its oldest banking house.',
  },
  steps: [
    {
      reach: 'gold',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.58,
      purposeLine: 'Weigh the offer',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The house has stopped paying. {cast:master}, its master, offers each creditor a third of their '
        + 'bill in coin. Three merchants have taken it.\n\n'
        + 'A noble with the largest claim wants the house\'s last pledge, the deed to its warehouses. By '
        + 'the house\'s own rule, any creditor may call an arbitration. Once called, it runs to a ruling, '
        + 'and the loser forfeits the bill.',
      criticalSuccessAfterimage: 'They worked out that the deed is worth far more than the house admits, and that a third is a '
        + 'small part of what it can pay.',
      successAfterimage: 'They worked out that the deed covers far more than a third of every bill.',
      successAtCostAfterimage: 'They worked out what the deed is worth, and the master saw them do it and closed the books.',
      failureAfterimage: 'They saw only the pages the master chose, and the third looked fair.',
      criticalFailureAfterimage: 'They took the master\'s figures on trust, and the figures were false.',
      deal: {
        count: 4,
        tags: ['insight', 'social'],
      },
      nudges: [
        {
          id: 'debt.stoke_the_grievance',
          name: 'Stoke The Grievance',
          sphere: 'spirit',
          essenceCost: 1,
          forecastDelta: 0.06,
          poleLean: {
            axis: 'courage_prudence',
            toward: 'positive',
          },
          imageTag: 'generic.energy',
          effectLine: 'Make the unpaid sum burn in their thoughts. They lean toward calling the arbitration.',
          bandProse: {
            success: 'The unpaid sum stayed in their thoughts, and they read every page the master showed for it.',
            success_at_cost: 'The unpaid sum drove them through the master\'s pages fast enough to be seen doing it.',
            failure: 'The unpaid sum burned in their thoughts, and they read the master\'s pages too fast.',
          },
        },
        {
          id: 'debt.counsel_patience',
          name: 'Plant Patience',
          sphere: 'mind',
          essenceCost: 1,
          forecastDelta: 0.06,
          poleLean: {
            axis: 'courage_prudence',
            toward: 'negative',
          },
          imageTag: 'generic.focus',
          effectLine: 'Put the sure coin first in their mind. They lean toward taking the offer over waiting on a '
            + 'ruling.',
          bandProse: {
            critical_success: 'They thought of the coin first, and counted exactly what a third came to.',
            near_miss: 'They thought of the coin first, and skipped a page about the deed.',
            failure: 'They thought only of the coin, and never asked about the deed.',
            critical_failure: 'They thought only of the coin, and took the master\'s word for the rest.',
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
          reach: 'gold',
          duration: {
            min: 1,
            max: 2,
          },
          difficulty: 0.66,
          purposeLine: 'Win the arbitration',
          onSuccess: [],
          onFailure: [],
          failBehavior: 'fail_action',
          narrativeTemplate: '{actor} calls the arbitration. The house\'s elders sit in its hall and read every claim against '
            + 'its books. {cast:claimant}, the noble, argues that the largest claim must be paid first, out of '
            + 'the deed. {actor} must prove their own bill ranks ahead. The ruling cannot be appealed, and '
            + 'every counting house in town will hear who lost.',
          criticalSuccessAfterimage: 'They proved their bill first in line, and the elders set the noble\'s claim last of all.',
          successAfterimage: 'They proved their bill first in line, to be paid out of the deed.',
          successAtCostAfterimage: 'They proved their bill first in line, and the elders charged the costs of the arbitration to '
            + 'them.',
          failureAfterimage: 'The elders ranked the noble\'s claim first, and the deed did not stretch to their bill.',
          criticalFailureAfterimage: 'The elders ruled against them on every point, and read the ruling aloud in the hall.',
          carryoverFactorLines: {
            critical_success: {
              text: 'They can prove the deed\'s true worth.',
              polarity: 'for',
              forecastDelta: 0.06,
            },
            success: {
              text: 'They know what the deed is worth.',
              polarity: 'for',
              forecastDelta: 0.04,
            },
            success_at_cost: {
              text: 'The master is ready for what they found.',
              polarity: 'against',
              forecastDelta: -0.02,
            },
            near_miss: {
              text: 'They know only part of what the deed is worth.',
              polarity: 'for',
              forecastDelta: 0.02,
            },
            failure: {
              text: 'They argue from half the house\'s books.',
              polarity: 'against',
              forecastDelta: -0.03,
            },
          },
          successMetadata: {
            rewardPool: {
              categoryWeights: {
                possession: 1,
              },
              tagFilters: ['#gold'],
            },
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Where the house\'s money went',
                detail: 'Most of the banking house\'s money went out as loans to the claimant noble\'s household and was '
                  + 'never repaid, read aloud from its own books.',
                reliability: 0.9,
                targetAgentId: '$actor',
              },
              {
                kind: 'reputation_with',
                targetLocationId: '$here',
                delta: 0.1,
              },
            ],
          },
          failureMetadata: {
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Where the house\'s money went',
                detail: 'Most of the banking house\'s money went out as loans to the claimant noble\'s household and was '
                  + 'never repaid, read aloud from its own books.',
                reliability: 0.9,
                targetAgentId: '$actor',
              },
              {
                kind: 'reputation_with',
                targetLocationId: '$here',
                delta: -0.12,
              },
            ],
          },
          deal: {
            count: 4,
            tags: ['social', 'presence'],
          },
          nudges: [
            {
              id: 'debt.scatter_the_figures',
              name: 'Scatter The Figures',
              sphere: 'chaos',
              essenceCost: 2,
              forecastDelta: 0.1,
              opposes: 'claimant',
              imageTag: 'generic.luck',
              effectLine: 'Make the noble lose their place in their own accounts before the elders. The larger claim sounds '
                + 'weaker for it.',
              bandProse: {
                success: 'The noble lost their place twice in their own accounts, and the elders noticed.',
                near_miss: 'The noble lost their place once, and {actor} was too slow to press it.',
                failure: 'The noble stumbled over one figure and recovered before the elders cared.',
                critical_failure: 'The noble found their place again at once, and the elders took them for the steadier head.',
              },
            },
            {
              id: 'debt.invoke_the_rule',
              name: 'Invoke The Rule',
              sphere: 'order',
              essenceCost: 2,
              forecastDelta: 0.12,
              imageTag: 'generic.oath',
              effectLine: 'Hold the elders to the letter of their own procedure. Every claim is weighed against the books, '
                + 'whatever the claimant\'s rank.',
              bandProse: {
                critical_success: 'The eldest of the elders read the rule aloud before the ruling, and ruled by it.',
                success: 'The elders kept to the letter of their rule, and weighed the noble\'s claim like any other.',
                success_at_cost: 'The elders kept to the letter of their rule, and the letter charged its costs to whoever called '
                  + 'them.',
                failure: 'The elders kept to the letter of their rule, and their rule favoured the larger claim.',
              },
            },
          ],
        },
        negative: {
          reach: 'gold',
          duration: {
            min: 1,
            max: 1,
          },
          difficulty: 0.3,
          purposeLine: 'Collect the third',
          onSuccess: [],
          onFailure: [],
          failBehavior: 'fail_action',
          narrativeTemplate: '{actor} takes the offer. {cast:master} counts out the third from the strongroom while other '
            + 'creditors queue behind. Some of the coin is clipped. {actor} must see a full third counted '
            + 'before the strongroom runs dry.',
          criticalSuccessAfterimage: 'They left with a full third in good coin, and the master\'s thanks for not calling the '
            + 'arbitration.',
          successAfterimage: 'They left with a full third in good coin.',
          successAtCostAfterimage: 'They left with a full third, part of it in clipped coin.',
          failureAfterimage: 'The strongroom ran dry before their turn, and they left with the master\'s note instead.',
          criticalFailureAfterimage: 'They left with a note on a house that has stopped paying its notes.',
          carryoverFactorLines: {
            critical_success: {
              text: 'They know to the coin what a third comes to.',
              polarity: 'for',
              forecastDelta: 0.05,
            },
            success: {
              text: 'They know what a third should come to.',
              polarity: 'for',
              forecastDelta: 0.03,
            },
            failure: {
              text: 'They take the master\'s count on trust.',
              polarity: 'against',
              forecastDelta: -0.03,
            },
          },
          successMetadata: {
            effects: [
              {
                kind: 'favor_creation',
                magnitudeRange: [0.15, 0.3],
                context: 'Took the third and spared the banking house an arbitration',
                debtorAgentId: '$cast:master',
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
            tags: ['social', 'craft'],
          },
        },
      },
      fallback: {
        reach: 'gold',
        duration: {
          min: 1,
          max: 1,
        },
        difficulty: 0.3,
        purposeLine: 'Collect the third',
        onSuccess: [],
        onFailure: [],
        failBehavior: 'fail_action',
        narrativeTemplate: '{actor} takes the offer. {cast:master} counts out the third from the strongroom while other '
          + 'creditors queue behind. Some of the coin is clipped. {actor} must see a full third counted '
          + 'before the strongroom runs dry.',
        criticalSuccessAfterimage: 'They left with a full third in good coin, and the master\'s thanks for not calling the '
          + 'arbitration.',
        successAfterimage: 'They left with a full third in good coin.',
        successAtCostAfterimage: 'They left with a full third, part of it in clipped coin.',
        failureAfterimage: 'The strongroom ran dry before their turn, and they left with the master\'s note instead.',
        criticalFailureAfterimage: 'They left with a note on a house that has stopped paying its notes.',
        carryoverFactorLines: {
          critical_success: {
            text: 'They know to the coin what a third comes to.',
            polarity: 'for',
            forecastDelta: 0.05,
          },
          success: {
            text: 'They know what a third should come to.',
            polarity: 'for',
            forecastDelta: 0.03,
          },
          failure: {
            text: 'They take the master\'s count on trust.',
            polarity: 'against',
            forecastDelta: -0.03,
          },
        },
        successMetadata: {
          effects: [
            {
              kind: 'favor_creation',
              magnitudeRange: [0.15, 0.3],
              context: 'Took the third and spared the banking house an arbitration',
              debtorAgentId: '$cast:master',
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
          tags: ['social', 'craft'],
        },
      },
    },
  ],
  traitVariants: [
    {
      traitId: 'trait.personality.gold.vice',
      forecastDelta: 0.04,
      factorLine: 'Being Greedy, they price the deed by what it yields.',
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'master',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['merchant'],
      supportRole: 'house_master',
      spawnNpcRole: 'merchant',
      spawnName: 'Aurel Vance',
    },
    {
      kind: 'actor',
      key: 'claimant',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['noble'],
      supportRole: 'rival_claimant',
      spawnNpcRole: 'noble',
      spawnName: 'Ysolde Carrow',
    },
  ],
  narrativeTemplates: {
    initiation: 'A banking house has stopped paying its bills. {actor} may take a third in coin, or call an '
      + 'arbitration against a noble who wants the house\'s last pledge.',
    success: '{actor} came away from the failing banking house paid.',
    failure: '{actor} came away from the failing banking house unpaid.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      positive: {
        overview: '{actor} called the arbitration.',
        changes: [],
        byOutcome: {
          critical_success: {
            overview: 'The elders read the house\'s books aloud. Most of its money had gone out as loans to '
              + '{cast:claimant}\'s household, never repaid. {actor} was paid in full, in goods from the '
              + 'warehouses, before the noble saw a coin.',
            changes: [
              {
                id: 'debt.pos.crit.rep',
                kind: 'reputation',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'The Town\'s Trust',
                detail: 'The town trusts {actor}\'s judgement with money more.',
                stateNoun: {
                  text: 'reputation with {target}',
                  entityId: '$here',
                  visualKind: 'location',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: 'trusts',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
              {
                id: 'debt.pos.crit.know',
                kind: 'shell_state',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'Where the money went',
                detail: '{actor} keeps the house\'s lending record.',
                stateNoun: {
                  text: 'knowledge',
                  tooltipId: 'ui.knowledge',
                },
                concepts: [
                  {
                    text: 'lending record',
                    tooltipId: 'ui.knowledge',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'debt.pos.crit.keep_quiet',
                label: 'Keep the noble\'s debts quiet',
                intent: 'Say no word outside the hall about the noble\'s loans. The noble owes the mortal for the '
                  + 'silence.',
                effects: [
                  {
                    kind: 'favor_creation',
                    magnitudeRange: [0.2, 0.35],
                    context: 'Kept the noble household\'s unpaid loans quiet',
                    debtorAgentId: '$cast:claimant',
                  },
                ],
              },
              {
                id: 'debt.pos.crit.tell_town',
                label: 'Tell the town who emptied the bank',
                intent: 'Let every counting house hear whose household borrowed the money. The town thinks better of the '
                  + 'mortal for it, and the noble thinks far worse.',
                effects: [
                  {
                    kind: 'reputation_with',
                    targetLocationId: '$here',
                    delta: 0.05,
                  },
                  {
                    kind: 'reputation_with',
                    targetAgentId: '$cast:claimant',
                    delta: -0.12,
                  },
                ],
              },
            ],
          },
          success: {
            overview: 'The elders read the house\'s books aloud, and most of its money had gone out as loans to '
              + '{cast:claimant}\'s household. {actor}\'s bill was paid in goods from the warehouses.',
            changes: [
              {
                id: 'debt.pos.succ.rep',
                kind: 'reputation',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'The Town\'s Trust',
                detail: 'The town trusts {actor}\'s judgement with money more.',
                stateNoun: {
                  text: 'reputation with {target}',
                  entityId: '$here',
                  visualKind: 'location',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: 'trusts',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
              {
                id: 'debt.pos.succ.know',
                kind: 'shell_state',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'Where the money went',
                detail: '{actor} keeps the house\'s lending record.',
                stateNoun: {
                  text: 'knowledge',
                  tooltipId: 'ui.knowledge',
                },
                concepts: [
                  {
                    text: 'lending record',
                    tooltipId: 'ui.knowledge',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'debt.pos.succ.keep_quiet',
                label: 'Keep the noble\'s debts quiet',
                intent: 'Say no word outside the hall about the noble\'s loans. The noble owes the mortal for the '
                  + 'silence.',
                effects: [
                  {
                    kind: 'favor_creation',
                    magnitudeRange: [0.2, 0.35],
                    context: 'Kept the noble household\'s unpaid loans quiet',
                    debtorAgentId: '$cast:claimant',
                  },
                ],
              },
              {
                id: 'debt.pos.succ.tell_town',
                label: 'Tell the town who emptied the bank',
                intent: 'Let every counting house hear whose household borrowed the money. The town thinks better of the '
                  + 'mortal for it, and the noble thinks far worse.',
                effects: [
                  {
                    kind: 'reputation_with',
                    targetLocationId: '$here',
                    delta: 0.05,
                  },
                  {
                    kind: 'reputation_with',
                    targetAgentId: '$cast:claimant',
                    delta: -0.12,
                  },
                ],
              },
            ],
          },
          success_at_cost: {
            overview: '{actor}\'s bill was paid in goods from the warehouses, though only after a long hearing. The '
              + 'books, read aloud, showed that {cast:claimant}\'s household had borrowed most of the house\'s '
              + 'money.',
            changes: [
              {
                id: 'debt.pos.cost.rep',
                kind: 'reputation',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'The Town\'s Trust',
                detail: 'The town trusts {actor}\'s judgement with money more.',
                stateNoun: {
                  text: 'reputation with {target}',
                  entityId: '$here',
                  visualKind: 'location',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: 'trusts',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
              {
                id: 'debt.pos.cost.know',
                kind: 'shell_state',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'Where the money went',
                detail: '{actor} keeps the house\'s lending record.',
                stateNoun: {
                  text: 'knowledge',
                  tooltipId: 'ui.knowledge',
                },
                concepts: [
                  {
                    text: 'lending record',
                    tooltipId: 'ui.knowledge',
                  },
                ],
              },
            ],
          },
          failure: {
            overview: 'The deed went to {cast:claimant}. The books, read aloud, showed that the noble\'s own household '
              + 'had borrowed most of the house\'s money. The ruling stands anyway.',
            changes: [
              {
                id: 'debt.pos.fail.rep',
                kind: 'reputation',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'The Town\'s Trust',
                detail: 'The town trusts {actor}\'s judgement with money less.',
                stateNoun: {
                  text: 'reputation with {target}',
                  entityId: '$here',
                  visualKind: 'location',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: 'trusts',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
              {
                id: 'debt.pos.fail.know',
                kind: 'shell_state',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'Where the money went',
                detail: '{actor} keeps the house\'s lending record.',
                stateNoun: {
                  text: 'knowledge',
                  tooltipId: 'ui.knowledge',
                },
                concepts: [
                  {
                    text: 'lending record',
                    tooltipId: 'ui.knowledge',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'debt.pos.fail.keep_quiet',
                label: 'Keep the noble\'s debts quiet',
                intent: 'Say no word outside the hall about the noble\'s loans. The noble owes the mortal for the '
                  + 'silence.',
                effects: [
                  {
                    kind: 'favor_creation',
                    magnitudeRange: [0.2, 0.35],
                    context: 'Kept the noble household\'s unpaid loans quiet',
                    debtorAgentId: '$cast:claimant',
                  },
                ],
              },
              {
                id: 'debt.pos.fail.tell_town',
                label: 'Tell the town who emptied the bank',
                intent: 'Let every counting house hear whose household borrowed the money. The town thinks better of the '
                  + 'mortal for it, and the noble thinks far worse.',
                effects: [
                  {
                    kind: 'reputation_with',
                    targetLocationId: '$here',
                    delta: 0.05,
                  },
                  {
                    kind: 'reputation_with',
                    targetAgentId: '$cast:claimant',
                    delta: -0.12,
                  },
                ],
              },
            ],
          },
          critical_failure: {
            overview: '{actor}\'s bill is worthless now. The books showed that {cast:claimant}\'s household had '
              + 'borrowed most of the house\'s money, and the deed still went to the noble. Every counting house '
              + 'in town knows who called the arbitration and lost.',
            changes: [
              {
                id: 'debt.pos.critfail.rep',
                kind: 'reputation',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'The Town\'s Trust',
                detail: 'The town trusts {actor}\'s judgement with money less.',
                stateNoun: {
                  text: 'reputation with {target}',
                  entityId: '$here',
                  visualKind: 'location',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: 'trusts',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
              {
                id: 'debt.pos.critfail.know',
                kind: 'shell_state',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'Where the money went',
                detail: '{actor} keeps the house\'s lending record.',
                stateNoun: {
                  text: 'knowledge',
                  tooltipId: 'ui.knowledge',
                },
                concepts: [
                  {
                    text: 'lending record',
                    tooltipId: 'ui.knowledge',
                  },
                ],
              },
            ],
          },
        },
      },
      negative: {
        overview: '{actor} took the house\'s offer.',
        changes: [],
        byOutcome: {
          critical_success: {
            overview: '{cast:master} counted {actor}\'s third out first, ahead of the whole queue. The deed goes to the '
              + 'noble.',
            changes: [
              {
                id: 'debt.neg.crit.favour',
                kind: 'shell_state',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'A Favour Owed',
                causeClause: 'Spared the house an arbitration',
                detail: '{cast:master} owes {actor} a favour.',
                stateNoun: {
                  text: 'a favour owed',
                  tooltipId: 'ui.favour_owed',
                },
                concepts: [
                  {
                    text: '{cast:master}',
                    entityId: '$cast:master',
                    visualKind: 'agent',
                  },
                ],
              },
            ],
          },
          success: {
            overview: '{actor} was paid before the strongroom emptied. The deed goes to the noble.',
            changes: [
              {
                id: 'debt.neg.succ.favour',
                kind: 'shell_state',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'A Favour Owed',
                causeClause: 'Spared the house an arbitration',
                detail: '{cast:master} owes {actor} a favour.',
                stateNoun: {
                  text: 'a favour owed',
                  tooltipId: 'ui.favour_owed',
                },
                concepts: [
                  {
                    text: '{cast:master}',
                    entityId: '$cast:master',
                    visualKind: 'agent',
                  },
                ],
              },
            ],
          },
          success_at_cost: {
            overview: '{actor} has their third. The house is left to its other creditors.',
            changes: [
              {
                id: 'debt.neg.cost.favour',
                kind: 'shell_state',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'A Favour Owed',
                causeClause: 'Spared the house an arbitration',
                detail: '{cast:master} owes {actor} a favour.',
                stateNoun: {
                  text: 'a favour owed',
                  tooltipId: 'ui.favour_owed',
                },
                concepts: [
                  {
                    text: '{cast:master}',
                    entityId: '$cast:master',
                    visualKind: 'agent',
                  },
                ],
              },
            ],
          },
          failure: {
            overview: '{actor} holds the master\'s note for the third, and no coin. The deed goes to the noble.',
            changes: [
              {
                id: 'debt.neg.fail.rep',
                kind: 'reputation',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'The Town\'s Trust',
                detail: 'The town trusts {actor}\'s judgement with money less.',
                stateNoun: {
                  text: 'reputation with {target}',
                  entityId: '$here',
                  visualKind: 'location',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: 'trusts',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
            ],
          },
          critical_failure: {
            overview: 'The merchants in the queue saw {actor} take the master\'s paper for coin. By evening every '
              + 'counting house in town has heard it.',
            changes: [
              {
                id: 'debt.neg.critfail.rep',
                kind: 'reputation',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'The Town\'s Trust',
                detail: 'The town trusts {actor}\'s judgement with money less.',
                stateNoun: {
                  text: 'reputation with {target}',
                  entityId: '$here',
                  visualKind: 'location',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: 'trusts',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
            ],
          },
        },
      },
    },
    fallback: {
      overview: '{actor} left the banking house before any count or ruling.',
      changes: [],
      byOutcome: {
        success: {
          overview: '{actor} left the banking house with the matter settled.',
          changes: [],
        },
        failure: {
          overview: '{actor} left the banking house unpaid. The deed goes to the noble.',
          changes: [],
        },
        critical_failure: {
          overview: '{actor} took the master\'s false figures on trust and left before any count or ruling. The deed '
            + 'goes to the noble.',
          changes: [],
        },
      },
    },
  },
  description: 'An opt-in debt arbitration at a failing town banking house: weigh the master\'s offer of a third '
    + '(Gold), then, by the mortal\'s own nerve, call an arbitration against a noble for the house\'s '
    + 'last pledge (a Vanguard, Gold) or collect the third before the strongroom runs dry (a Watcher, '
    + 'Gold). The arbitration pays a #gold possession and the house\'s lending record, and moves the '
    + 'mortal\'s standing in town either way.',
  locationSubtypes: expandSettings(['urban']),
  consequenceDraw: ['possession', 'knowledge'],
};

export const DEBT_ARBITRATION_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
