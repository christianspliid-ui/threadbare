/**
 * The Poisoned Feast (slug poisoned-feast) - slot 1 of master-everyday-2 (THR-1757), a seeded sequel.
 * 
 * Brief: `Docs/plans/encounters/master-everyday-2-brief.md`. Packet: `poisoned-feast-revised.md`.
 * plotHookRolled: hook.forbidden_knowledge_price, hook.followed_on_the_road, hook.scarcity_crisis
 * plotHookTaken:  hook.followed_on_the_road - whoever paid for the poison learns the master lived and sends
 *                 people after them (#rival_strike). forbidden_knowledge_price survives as the cost of the win.
 * Seed dice: p3 choice (naming a guest shames the guild; naming no one leaves the master suspected) -
 *            opposition own_trait (Vengeful, Judgemental) - disposition open - agentRole the_target -
 *            scale personal - system omens (advisory; nothing omen-shaped fits a poisoning, not wired).
 * 
 * --- The narrator's 12 questions, answered ---
 *   1 P1 arrival?      {actor} is a guest at the high table of the guild feast in {location}.
 *   2 P2 events?       At the toast the guild-master drank from {actor}'s cup, fell, has not woken; doors barred.
 *   3 P3 one stake?    Choice (rolled): naming a guest shames the guild; naming no one leaves {actor} suspected.
 *   4 <=80 words?      Under 80 by the gate (opening + step-0 spine; critic pass kept the count).
 *   5 Read aloud?      Report throughout; no interior sensation.
 *   6 Stated?          'The poison was meant for {actor}, and {actor} is also the likeliest suspect.'
 *   7 Every sentence works? Challenge, test or outcome.
 *   8 Nothing unintroduced? Cups, the guild-master and the coroner precede step 0's cards; the six
 *                      guildsmen and the chairs precede step 1's.
 *   9 One named person? {cast:coroner} on both spines; {cast:poisoner} named only after the roll.
 *  10 Stake in a sentence? Can {actor} name who poisoned the cup meant for them before the coroner rules?
 *  11 Cards verb+noun? Settle The Dregs, Rouse The Stricken, Show The Last Hour, Cool A Hot Grudge.
 *                      No effect line shares a word with its name.
 *  12 Opening per class? urban, written.
 * 
 * --- Mechanical design block ---
 *   Crux            The cup poured for {actor} at the guild feast poisoned the guild-master instead, and the
 *                   coroner wants {actor} to name whose hand did it, though {actor} is the likeliest suspect.
 *   Shape           Seeded Sequel (placeless) on Puzzle - Investigation - Resolution. eye 0.74
 *                   (continue_weakened) -> eye 0.80 (fail_action). Linear, branch count 0. Mean 0.77.
 *   Consequence hand (binding): secret + story_seed, no swap.
 *                   secret: hidden_mark secret_knowledge on $actor + favor_creation debtor $cast:coroner on
 *                   step 1 success; hidden_mark concealed_action on $cast:poisoner on step 1 failure.
 *                   story_seed: encounter_seed query #rival_strike (The Hired Knives), placeless, delay 30,
 *                   on step 1 success AND step 1 failure - the patron learns the master lived either way.
 *   Standing        reputation_with $here +0.06 / -0.06 on step 1; -0.03 on step 0 failure (backs the
 *                   critical_failure SCAR when a step-0 critical failure ends the action).
 *   Opposition      The mortal's own trait: Vengeful (trait.core.core_forgiveness.vice, -0.05, unlocks the
 *                   trait card Cool A Hot Grudge) and Judgemental (trait.personality.eye.vice, -0.04).
 *                   Keen-Eyed (trait.mastery.keen-eyed, +0.05) is the one variant for.
 *   Cards           Step 0 Signature (matter) + Balm (life); step 1 Signature (time) + Trait card. All
 *                   essence-priced except the trait card (cost 0). No rider, no grant, no Heavy Hand.
 *   Cool failure    Nobody is killed, jailed or branded. The coroner closes the inquest open, the guild
 *                   believes the master poured the cup, and on the worst ending the coroner's record names
 *                   them - the name before the purse.
 *   Accepted limit  The #rival_strike family has one member, The Hired Knives, whose spine gives its own
 *                   reason for the strangers (a god's help seen around the mortal). Critic pass (2026-10-14):
 *                   the PATH chip, both seedLabels and the step-1 spine now promise only what the family
 *                   delivers - whoever paid sends their people after {actor} - and no longer promise that
 *                   the payer is named or that the sequel will speak of the feast. The sequel's own reason is
 *                   additive, not contradictory (the intended victim walked away). No better-fitting family or
 *                   seed-only template exists in the corpus. The query keeps the family's eligibility filter
 *                   (rural / urban / wayside), so it withers only off the settled map.
 *   Known gap       A step-1 critical_failure plants the seed, but the critical_failure band is also reached
 *                   by a step-0 critical failure that plants nothing, so that band carries no PATH chip (an
 *                   omission, never a false chip; no band-scoped effect predicate exists to close it).
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
  id: 'encounter.town.poisoned_feast',
  stakes: {
    goal: 'name the hand that poisoned the cup',
    risk: 'be written down as the likeliest poisoner',
    won: 'named the hand that poisoned the cup',
    lost: 'could not say whose hand poisoned the cup',
    lostBadly: 'was written down as the likeliest poisoner',
  },
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Poisoned Feast',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['revelation_discretion', 'mercy_ruthlessness'],
  settings: ['urban'],
  openings: {
    urban: '{actor} is a guest at the high table of the guild feast in {location}, held in the abbey '
      + 'refectory.',
  },
  steps: [
    {
      reach: 'eye',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.74,
      purposeLine: 'Read the poisoned cup',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'At the toast the guild-master drank from {actor}\'s cup, fell, and has not woken. '
        + '{cast:coroner}, the town coroner, has barred the doors.\n\n'
        + 'The poison was meant for {actor}, and {actor} is also the likeliest suspect. {cast:coroner} asks '
        + '{actor} to read the table before ruling. Naming a guest will shame the guild. Naming no one '
        + 'leaves {actor} under suspicion.',
      criticalSuccessAfterimage: 'Within the hour they showed {cast:coroner} the wolfsbane rubbed inside {actor}\'s cup, and a '
        + 'smear of it on one guest\'s sleeve.',
      successAfterimage: 'The poison was wolfsbane, rubbed inside {actor}\'s cup before the wine was poured.',
      successAtCostAfterimage: 'They found the wolfsbane in {actor}\'s cup, but {cast:coroner} had sent the guests home for the '
        + 'night first.',
      failureAfterimage: 'They could not tell what poison was in the cup, or when it went in.',
      criticalFailureAfterimage: 'They named the guild-master\'s own cup as the poisoned one, and {cast:coroner} wrote down that '
        + '{actor} sat closest to it.',
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
        count: 3,
        tags: ['insight', 'lore'],
      },
      nudges: [
        {
          id: 'feast.settle_the_dregs',
          name: 'Settle The Dregs',
          sphere: 'matter',
          essenceCost: 2,
          forecastDelta: 0.11,
          imageTag: 'generic.matter',
          effectLine: 'Pull every powder in the cups down to the bottom, so a poisoned cup shows a dark ring.',
          bandProse: {
            critical_success: 'A dark ring rose in {actor}\'s cup, and every other cup on the table stayed clear.',
            success: 'A dark ring settled at the bottom of {actor}\'s cup.',
            near_miss: 'A faint ring showed in {actor}\'s cup, too faint to show {cast:coroner}.',
            failure: 'Every cup on the table showed a dark ring, from the dregs of the red wine.',
          },
        },
        {
          id: 'feast.rouse_the_stricken',
          name: 'Rouse The Stricken',
          sphere: 'life',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.vigor',
          effectLine: 'Ease the poison in a sick body, so the poisoned can wake long enough to speak.',
          bandProse: {
            success_at_cost: 'The guild-master woke long enough to say the wine tasted bitter, then slept again.',
            failure: 'The guild-master stirred but did not wake.',
            critical_failure: 'The guild-master woke, looked at {actor}, and said {actor} had poured the wine.',
          },
        },
      ],
    },
    {
      reach: 'eye',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.8,
      purposeLine: 'Name the poisoner',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: 'Six guildsmen sat within reach of that cup, and one of them poisoned it. Whoever paid that '
        + 'guildsman will soon hear that {actor} is still alive.\n\n'
        + '{cast:coroner} gives the verdict at dawn. If no hand is named by then, {location} will take '
        + '{actor} for the poisoner.',
      criticalSuccessAfterimage: '{cast:poisoner} broke down before the whole hall and confessed to being paid, but was too afraid '
        + 'to say by whom.',
      successAfterimage: 'The cup-bearer had seen {cast:poisoner} at {actor}\'s chair with a hand over the cup.',
      successAtCostAfterimage: '{actor} named {cast:poisoner}, but the guild closed ranks and swore {cast:poisoner} never left '
        + 'the bench.',
      failureAfterimage: 'The guests\' accounts of who sat where did not agree, and {actor} could not say whose hand '
        + 'poisoned the cup.',
      criticalFailureAfterimage: '{actor} named the wrong guildsman, and five guests swore that guildsman never left the bench. '
        + '{cast:coroner} wrote {actor}\'s name down instead.',
      carryoverFactorLines: {
        critical_success: {
          text: 'One guest\'s sleeve carries a smear of the poison.',
          polarity: 'for',
          forecastDelta: 0.06,
        },
        success: {
          text: 'They know what the poison was and when it went in.',
          polarity: 'for',
          forecastDelta: 0.04,
        },
        success_at_cost: {
          text: 'The guests have had a night to agree their stories.',
          polarity: 'against',
          forecastDelta: -0.02,
        },
        near_miss: {
          text: 'They know the poison, but cannot yet prove it.',
          polarity: 'against',
          forecastDelta: -0.02,
        },
        failure: {
          text: 'They do not know what was in the cup.',
          polarity: 'against',
          forecastDelta: -0.05,
        },
      },
      successMetadata: {
        effects: [
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: 0.06,
          },
          {
            kind: 'hidden_mark',
            category: 'secret_knowledge',
            severity: 0.5,
            label: 'Knows who poisoned the cup at the guild feast',
            targetAgentId: '$actor',
          },
          {
            kind: 'favor_creation',
            magnitudeRange: [0.15, 0.3],
            context: 'Spared the coroner a wrong ruling at the guild feast',
            debtorAgentId: '$cast:coroner',
          },
          {
            kind: 'encounter_seed',
            query: {
              kind: 'encounter_template',
              tags: ['#rival_strike'],
            },
            targetAgentId: '$actor',
            delayTicks: 30,
            priority: 1,
            seedLabel: 'Whoever paid for the poison at the guild feast knows {actor} lived, and sends their people.',
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
          {
            kind: 'hidden_mark',
            category: 'concealed_action',
            severity: 0.6,
            label: 'Poisoned a master\'s cup at the guild feast and was not named',
            targetAgentId: '$cast:poisoner',
          },
          {
            kind: 'encounter_seed',
            query: {
              kind: 'encounter_template',
              tags: ['#rival_strike'],
            },
            targetAgentId: '$actor',
            delayTicks: 30,
            priority: 1,
            seedLabel: 'Whoever paid for the poison at the guild feast knows {actor} lived, and sends their people.',
          },
        ],
      },
      deal: {
        count: 3,
        tags: ['insight', 'social'],
      },
      nudges: [
        {
          id: 'feast.show_the_last_hour',
          name: 'Show The Last Hour',
          sphere: 'time',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.memory',
          effectLine: 'Bring back to every guest\'s mind who stood behind which chair while the wine was poured.',
          bandProse: {
            critical_success: 'Every guest remembered the same thing: {cast:poisoner} leaning over {actor}\'s cup before the '
              + 'toast.',
            success: 'Two more guests remembered it once the hour came back to them.',
            success_at_cost: 'The guests remembered {cast:poisoner} at {actor}\'s chair, and the guild began to quarrel over '
              + 'it.',
            near_miss: 'One guest remembered a hand near {actor}\'s cup, but not whose it was.',
            failure: 'The hour came back to every guest, and each one blamed a different neighbour.',
            critical_failure: 'The guests remembered the hour, and three of them remembered {actor} beside the guild-master\'s '
              + 'cup.',
          },
        },
        {
          id: 'feast.cool_a_hot_grudge',
          libraryCardId: 'card.trait_card.core',
          name: 'Cool A Hot Grudge',
          requiredTrait: 'trait.core.core_forgiveness.vice',
          essenceCost: 0,
          forecastDelta: 0.07,
          imageTag: 'generic.mercy',
          effectLine: 'Calm the anger they carry, so they weigh every face before naming one.',
          bandProse: {
            critical_success: '{actor} passed over the first guest they wanted to blame, and found the true hand next.',
            failure: '{actor} wanted one guest blamed so badly that the others stopped answering questions.',
          },
        },
      ],
    },
  ],
  traitVariants: [
    {
      traitId: 'trait.core.core_forgiveness.vice',
      forecastDelta: -0.05,
      factorLine: 'Being Vengeful, they want the hand that tried to kill them named fast.',
      addNudgeIds: ['feast.cool_a_hot_grudge'],
    },
    {
      traitId: 'trait.personality.eye.vice',
      forecastDelta: -0.04,
      factorLine: 'Being Judgemental, they take the first guest who looks guilty as proof.',
    },
    {
      traitId: 'trait.mastery.keen-eyed',
      forecastDelta: 0.05,
      factorLine: 'Being Keen-Eyed, they see which hands go near which cups.',
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'coroner',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['healer'],
      supportRole: 'coroner',
      spawnNpcRole: 'healer',
      spawnName: 'Maud Ashby',
    },
    {
      kind: 'actor',
      key: 'poisoner',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      supportRole: 'guildsman',
      spawnNpcRole: 'merchant',
      spawnName: 'Hob Tanner',
    },
  ],
  narrativeTemplates: {
    initiation: 'A guild feast in {location} has ended with the guild-master poisoned, and the coroner asks '
      + '{actor} to read the table.',
    success: 'The hand that poisoned the cup was named.',
    failure: 'No hand was named.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The coroner\'s inquest at the guild feast in {location} is closed.',
      changes: [],
      reactions: [],
      byOutcome: {
        critical_success: {
          overview: '{cast:coroner} ruled the guild-master poisoned by {cast:poisoner}, and the guild-master is awake '
            + 'and mending.',
          changes: [
            {
              id: 'feast.crit.regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'Read true',
              detail: '{location} thinks well of {actor}.',
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
            },
            {
              id: 'feast.crit.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'A favour owed',
              causeClause: 'Spared a wrong ruling',
              detail: '{cast:coroner} owes {actor} a favour.',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              concepts: [
                {
                  text: '{cast:coroner}',
                  entityId: '$cast:coroner',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'feast.crit.patron_seed',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
              title: 'The one who paid',
              detail: 'Whoever paid for the poison is sending their people after {actor}.',
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
          overview: '{cast:coroner} ruled that {cast:poisoner} poisoned the cup, and {actor} leaves the inquest '
            + 'cleared.',
          changes: [
            {
              id: 'feast.win.regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'Read true',
              detail: '{location} thinks well of {actor}.',
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
            },
            {
              id: 'feast.win.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'A favour owed',
              causeClause: 'Spared a wrong ruling',
              detail: '{cast:coroner} owes {actor} a favour.',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              concepts: [
                {
                  text: '{cast:coroner}',
                  entityId: '$cast:coroner',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'feast.win.patron_seed',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
              title: 'The one who paid',
              detail: 'Whoever paid for the poison is sending their people after {actor}.',
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
          overview: '{cast:coroner} ruled for {actor}, but the guild has not forgiven the master who named one of its '
            + 'own.',
          changes: [
            {
              id: 'feast.cost.regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'Read true',
              detail: '{location} thinks well of {actor}.',
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
            },
            {
              id: 'feast.cost.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'A favour owed',
              causeClause: 'Spared a wrong ruling',
              detail: '{cast:coroner} owes {actor} a favour.',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              concepts: [
                {
                  text: '{cast:coroner}',
                  entityId: '$cast:coroner',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'feast.cost.patron_seed',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
              title: 'The one who paid',
              detail: 'Whoever paid for the poison is sending their people after {actor}.',
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
          overview: '{cast:coroner} closed the inquest with no hand named, and half the guild believes {actor} poured '
            + 'the cup.',
          changes: [
            {
              id: 'feast.lost.regard',
              kind: 'reputation',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Under suspicion',
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
            {
              id: 'feast.lost.patron_seed',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
              title: 'The one who paid',
              detail: 'Whoever paid for the poison is sending their people after {actor}.',
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
        critical_failure: {
          overview: '{cast:coroner}\'s record names {actor} as the likeliest hand, and the guild believes it.',
          changes: [
            {
              id: 'feast.broke.regard',
              kind: 'reputation',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Misread',
              causeClause: 'Before the whole guild',
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
  description: 'At a guild feast in the abbey refectory, the guild-master drank from a guest\'s cup and fell. '
    + 'The coroner wants the poisoner named by dawn, and the guest whose cup it was is the likeliest '
    + 'suspect.',
  locationSubtypes: expandSettings(['urban']),
  consequenceDraw: ['secret', 'story_seed'],
};

export const POISONED_FEAST_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
