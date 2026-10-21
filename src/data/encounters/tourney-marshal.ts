/**
 * The Tourney Marshal (slug tourney-marshal) - slot 4 of the master-everyday-2 batch (THR-1757).
 * 
 * Brief: `Docs/plans/encounters/master-everyday-2-brief.md` (slot 4, binding).
 * Draft: `tourney-marshal-draft.md`. Revised (self-edit against the 35 REVISE triggers): `tourney-marshal-revised.md`.
 * plotHookRolled: hook.monster_eradication, hook.siege_and_hold, hook.rebuilding_trust
 * plotHookTaken:  hook.siege_and_hold - the lists are a position held against a force that can afford to
 *                 wait: an order whose doctrine accepts no end but a yield. rebuilding_trust is blended
 *                 thinly through the success-side reactions. monster_eradication dropped: no monster on an
 *                 everyday board.
 * Rolled constraints (brief, binding): reach iron - steps iron 0.76 -> iron 0.80 - settings urban (rolled
 * rural survives as the tourney field outside the walls) - shape danger -> confrontation -> aftermath
 * (rolled appointment, overridden by the brief) - consequence hand condition + secret - p3Shape threat -
 * opposition faction (doctrine) - disposition hostile - agentRole competitor - scale company - rarityTier 2
 * - scale local - intrinsicTier shaping.
 * 
 * --- The narrator's 12 questions, answered ---
 *   1 P1 arrival?      {actor} arrives in {location}, where the town has asked {actor} to marshal its tourney.
 *   2 P2 events?       A knightly order has called a grudge bout that its doctrine says ends only at a
 *                      yield, and the young noble will not yield.
 *   3 P3 one stake?    Threat: hold the lists before the bout becomes a killing.
 *   4 <=80 words?      79 (opening + step-0 spine).
 *   5 Read aloud?      Every sentence is a report.
 *   6 Stated?          The doctrine, the refusal and the danger are stated, never encoded.
 *   7 Every sentence works? Challenge, test or outcome.
 *   8 Nothing unintroduced? The barrier, the raised sword and both sides' men in the step-0 spine; the
 *                      champion and the marshal's word in step 1's, before any card acts on them.
 *   9 One named person? Step 0 {cast:heir}; step 1 {cast:champion}.
 *  10 Stake in a sentence? Can the marshal stop a grudge bout before the order's champion kills a young
 *                      noble who will not yield?
 *  11 Cards verb+noun? Stiffen The Barrier, Halt The Blade, Give The Word Weight, Dull The Sword Arm. No
 *                      effect line shares a word with its name; no digits.
 *  12 Opening per class? urban, written.
 * 
 * --- Mechanical design block ---
 *   Crux            The agent is marshal of a town's tourney, and a knightly order's grudge bout against a
 *                   young noble who will not yield is about to become a killing.
 *   Shape           Danger - Confrontation - Aftermath. iron 0.76 (continue_weakened) -> iron 0.80
 *                   (fail_action). Linear, branch count 0. Mean 0.78. A step-0 critical_failure ends the
 *                   action.
 *   Fight system    None. The bout is fiction; no fight, confront, monster or rank gate.
 *   Consequence hand (binding): condition + secret, no swap. Festival: apply_condition
 *                   trait.condition.location.festival on $here on step 1 success (the town keeps the last
 *                   day as a feast; an extra place write, not the drawn family); condition_attachment
 *                   trait.condition.wounded on $cast:heir on step 1 failure (the maimed noble). secret: favor_creation, debtor $cast:heir, on
 *                   step 1 success (the young noble's house owes the marshal).
 *   Standing        reputation_with $here +0.06 / -0.06 on step 1; -0.02 on step 0 failure. bond_change
 *                   $cast:heir -0.10/-0.12 on step 1 failure and -0.04/-0.05 on step 0 failure, so the
 *                   critical_failure chips are backed on both routes.
 *   Cost channels   All specials essence-priced. No Heavy Hand, no rider, no grant.
 *   Cool failure    The mortal is not hurt past a cut, jailed or branded. The young noble is maimed or
 *                   nearly killed, and the master's name is spent before the town that made them marshal.
 *   Accepted limits The success_at_cost cut hand is prose only. Wounded is chipped on failure only,
 *                   because critical_failure is shared with the step-0 route where it never fires.
 *   Systems quota   cast + rewards + conditions + reputation - four.
 * 
 * --- Trait hooks ---
 *   Gate? None. Variant? trait.personality.iron.virtue (Brave) +0.04, trait.reputation.iron.negative
 *   (Brutal Thug) -0.04. Trait-only nudge? None. Trait fragment? None.
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
  id: 'encounter.town.tourney_marshal',
  stakes: {
    goal: 'stop a grudge bout before it becomes a killing',
    risk: 'see a young noble carried off more dead than alive',
    won: 'stopped a grudge bout before it became a killing',
    lost: 'could not stop the champion maiming a young noble',
    lostBadly: 'saw a young noble carried off more dead than alive',
  },
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Tourney Marshal',
  reach: 'iron',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['mercy_ruthlessness', 'courage_prudence'],
  settings: ['urban'],
  openings: {
    urban: '{actor} arrives in {location}, where the town has asked {actor} to marshal its tourney.',
  },
  steps: [
    {
      reach: 'iron',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.76,
      purposeLine: 'Hold the lists',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'A knightly order has called a grudge bout against {cast:heir}, a young noble who insulted it. '
        + 'The order\'s doctrine says the bout ends only when one fighter yields. {cast:heir} will not '
        + 'yield.\n\n'
        + 'On the third pass {cast:heir} is knocked down. The order\'s champion raises a sword over the '
        + 'young noble, and both sides\' men climb the barrier. {actor} has to hold the lists before the '
        + 'bout becomes a killing.',
      criticalSuccessAfterimage: 'They got between the fighters before the sword fell, and both sides\' men stepped back off the '
        + 'barrier.',
      successAfterimage: 'They got between the fighters and turned both sides\' men back from the barrier.',
      nearMissAfterimage: 'They got between the fighters, but not before a few of the house\'s men were over the barrier.',
      successAtCostAfterimage: 'They turned the men back from the barrier, but the sword came down on {cast:heir}\'s shield arm '
        + 'first.',
      failureAfterimage: 'The house\'s men got into the lists, and {actor} had to drive them out before reaching the '
        + 'fighters.',
      criticalFailureAfterimage: 'Both sides\' men broke into the lists, and {cast:heir} was trampled in the brawl before {actor} '
        + 'could get there.',
      failureMetadata: {
        effects: [
          {
            kind: 'bond_change',
            withAgentId: '$cast:heir',
            sentimentDelta: -0.04,
            trustDelta: -0.05,
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
        tags: ['might', 'peril'],
      },
      nudges: [
        {
          id: 'tourney.stiffen_the_barrier',
          name: 'Stiffen The Barrier',
          sphere: 'force',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.ward',
          effectLine: 'Set a wooden fence fast against any weight, so no crowd can push it over or climb it.',
          bandProse: {
            critical_success: 'The barrier did not move under a single boot, and the men on it climbed back down.',
            success: 'The barrier held under the climbing men, and {actor} had time to reach the fighters.',
            near_miss: 'The barrier held at one end and sagged at the other, and a few men got over.',
            failure: 'The barrier held, so the house\'s men ran round the end of it instead.',
          },
        },
        {
          id: 'tourney.halt_the_blade',
          name: 'Halt The Blade',
          sphere: 'time',
          essenceCost: 1,
          forecastDelta: 0.08,
          opposes: 'champion',
          imageTag: 'generic.blade',
          effectLine: 'Hold a raised weapon a breath longer at the top of its swing, so there is time to get under it.',
          bandProse: {
            success: 'The champion\'s sword hung at the top of its swing, and {actor} got under it.',
            success_at_cost: 'The sword hung for a breath, then came down before {actor} could get fully under it.',
            failure: 'The sword hung for a breath, and {actor} was still too far away to use it.',
            critical_failure: 'The sword hung for a breath, and in that breath the house\'s men reached the champion first.',
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
      purposeLine: 'Stand the champion down',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: '{cast:champion}, the order\'s champion, faces {actor} in the middle of the lists. The champion '
        + 'will not leave the lists without a yield, and the young noble will still not give one. The '
        + 'champion says no marshal\'s word can end a grudge bout. If {actor} cannot make the champion '
        + 'lower the sword, the young noble will be maimed in front of the whole town, and the town will '
        + 'blame its marshal.',
      criticalSuccessAfterimage: '{cast:champion} lowered the sword, and the order agreed before the whole field to call the bout '
        + 'ended.',
      successAfterimage: '{cast:champion} lowered the sword, and the heralds called the bout ended.',
      successAtCostAfterimage: '{cast:champion} lowered the sword, but {actor} took a cut across the hand catching the last '
        + 'stroke.',
      failureAfterimage: '{cast:champion} pushed past {actor} and beat the young noble down, and the house\'s men carried '
        + 'the noble off with a broken leg.',
      criticalFailureAfterimage: '{cast:champion} pushed {actor} aside and struck {cast:heir} down again before the heralds '
        + 'reached the fighters.',
      carryoverFactorLines: {
        critical_success: {
          text: 'The marshal has already stopped the champion\'s sword once.',
          polarity: 'for',
          forecastDelta: 0.06,
        },
        success: {
          text: 'Both sides\' men are back behind the barrier.',
          polarity: 'for',
          forecastDelta: 0.04,
        },
        success_at_cost: {
          text: 'The young noble is hurt and cannot stand.',
          polarity: 'against',
          forecastDelta: -0.02,
        },
        near_miss: {
          text: 'A few of the house\'s men are still in the lists.',
          polarity: 'against',
          forecastDelta: -0.03,
        },
        failure: {
          text: 'The marshal is tired from driving the house\'s men out.',
          polarity: 'against',
          forecastDelta: -0.05,
        },
      },
      successMetadata: {
        effects: [
          {
            kind: 'favor_creation',
            magnitudeRange: [0.4, 0.6],
            context: 'Stopped a grudge bout before it killed the young noble',
            debtorAgentId: '$cast:heir',
          },
          {
            kind: 'apply_condition',
            conditionTraitId: 'trait.condition.location.festival',
            targetLocationId: '$here',
            intensity: 0.5,
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
            kind: 'condition_attachment',
            templateId: 'trait.condition.wounded',
            targetAgentId: '$cast:heir',
          },
          {
            kind: 'bond_change',
            withAgentId: '$cast:heir',
            sentimentDelta: -0.1,
            trustDelta: -0.12,
          },
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: -0.06,
          },
        ],
      },
      deal: {
        count: 3,
        tags: ['might', 'presence'],
      },
      nudges: [
        {
          id: 'tourney.give_the_word_weight',
          name: 'Give The Word Weight',
          sphere: 'order',
          essenceCost: 2,
          forecastDelta: 0.12,
          opposes: 'champion',
          imageTag: 'generic.oath',
          effectLine: 'Make a spoken command carry the force of law, so sworn fighters feel bound to obey it.',
          bandProse: {
            critical_success: '{cast:champion} heard the marshal\'s command as law, and set the sword point-down in the sand.',
            success: '{cast:champion} stopped at the marshal\'s command, as a sworn knight stops for a herald.',
            success_at_cost: '{cast:champion} stopped at the command, but swung once more before stopping.',
            near_miss: '{cast:champion} stopped at the command, then said the doctrine stood above it.',
            failure: '{cast:champion} heard the command, and said only the order\'s grand master could give one.',
            critical_failure: '{cast:champion} took the command as a challenge, and struck harder to prove the doctrine.',
          },
        },
        {
          id: 'tourney.dull_the_sword_arm',
          name: 'Dull The Sword Arm',
          sphere: 'entropy',
          essenceCost: 1,
          forecastDelta: 0.08,
          opposes: 'champion',
          imageTag: 'generic.decay',
          effectLine: 'Drain a fighter\'s last strength, so the weapon they hold sinks lower with every breath.',
          bandProse: {
            success: '{cast:champion}\'s sword sank lower with each breath, and {actor} stepped inside its reach.',
            success_at_cost: '{cast:champion}\'s arm gave out, and the falling sword caught {actor} across the hand.',
            failure: '{cast:champion}\'s arm tired, and the champion moved the sword to the other hand.',
            critical_failure: '{cast:champion}\'s arm tired, so the champion drove at {cast:heir} to end it quickly.',
          },
        },
      ],
    },
  ],
  traitVariants: [
    {
      traitId: 'trait.personality.iron.virtue',
      forecastDelta: 0.04,
      factorLine: 'Being Brave, they step between the swords without slowing.',
    },
    {
      traitId: 'trait.reputation.iron.negative',
      forecastDelta: -0.04,
      factorLine: 'Known as a Brutal Thug, they are not trusted to keep the peace.',
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'heir',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['noble'],
      supportRole: 'tourney_young_noble',
      spawnNpcRole: 'noble',
      spawnName: 'Aldric Fenmoor',
    },
    {
      kind: 'actor',
      key: 'champion',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      supportRole: 'tourney_order_champion',
      spawnNpcRole: 'warrior_priest',
      spawnName: 'Brannoc Vell',
    },
  ],
  narrativeTemplates: {
    initiation: 'A knightly order is fighting a grudge bout to the yield, and the tourney\'s marshal has to stop '
      + 'it.',
    success: '{actor} stopped the grudge bout, and both fighters left the lists alive.',
    failure: 'The order\'s champion beat the young noble down, and {actor} could not stop it.',
  },
  aftermathConfig: {
    branchOnStep: 1,
    variants: {},
    fallback: {
      overview: 'The heralds close the lists, and the crowd goes back through the town gate.',
      changes: [],
      byOutcome: {
        critical_success: {
          overview: 'The order and {cast:heir}\'s house both agreed before the whole field that the bout was ended, '
            + 'and both fighters walked out of the lists.',
          changes: [
            {
              id: 'tourney.cs.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              title: 'A House in Debt',
              detail: '{cast:heir} owes {actor} a favour now.',
              concepts: [
                {
                  text: '{cast:heir}',
                  entityId: '$cast:heir',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'tourney.cs.festival',
              kind: 'trait',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'Festival',
                entityId: 'trait.condition.location.festival',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'Festival',
                  entityId: 'trait.condition.location.festival',
                  visualKind: 'attachment',
                },
              ],
              title: 'A Feast for the Field',
              detail: '{location} keeps the tourney\'s last day as a feast.',
            },
            {
              id: 'tourney.cs.regard',
              kind: 'reputation',
              category: 'boon',
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
          reactions: [
            {
              id: 'tourney.cs.honour_the_order',
              label: 'Give the order its honour',
              intent: 'Announce that the champion lowered the sword at the marshal\'s word. The champion will remember '
                + 'it, and the young noble\'s house will not like it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:champion',
                  sentimentDelta: 0.1,
                },
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:heir',
                  sentimentDelta: -0.05,
                },
              ],
            },
            {
              id: 'tourney.cs.call_a_draw',
              label: 'Call the bout a draw',
              intent: 'Announce that neither fighter yielded and neither lost. The noble\'s family thinks better of the '
                + 'mortal, and the champion takes it as a slight.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:heir',
                  sentimentDelta: 0.08,
                },
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:champion',
                  sentimentDelta: -0.06,
                },
              ],
            },
          ],
        },
        success: {
          overview: '{cast:heir}\'s house carried the young noble home on a litter, bruised and alive. The order\'s '
            + 'knights rode out of {location} by evening.',
          changes: [
            {
              id: 'tourney.s.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              title: 'A House in Debt',
              detail: '{cast:heir} owes {actor} a favour now.',
              concepts: [
                {
                  text: '{cast:heir}',
                  entityId: '$cast:heir',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'tourney.s.festival',
              kind: 'trait',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'Festival',
                entityId: 'trait.condition.location.festival',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'Festival',
                  entityId: 'trait.condition.location.festival',
                  visualKind: 'attachment',
                },
              ],
              title: 'A Feast for the Field',
              detail: '{location} keeps the tourney\'s last day as a feast.',
            },
            {
              id: 'tourney.s.regard',
              kind: 'reputation',
              category: 'boon',
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
          reactions: [
            {
              id: 'tourney.s.honour_the_order',
              label: 'Give the order its honour',
              intent: 'Announce that the champion lowered the sword at the marshal\'s word. The champion will remember '
                + 'it, and the young noble\'s house will not like it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:champion',
                  sentimentDelta: 0.1,
                },
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:heir',
                  sentimentDelta: -0.05,
                },
              ],
            },
            {
              id: 'tourney.s.call_a_draw',
              label: 'Call the bout a draw',
              intent: 'Announce that neither fighter yielded and neither lost. The noble\'s family thinks better of the '
                + 'mortal, and the champion takes it as a slight.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:heir',
                  sentimentDelta: 0.08,
                },
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:champion',
                  sentimentDelta: -0.06,
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview: 'The bout is ended and {cast:heir} is alive, but it came closer to a killing than a marshal '
            + 'should allow. The order\'s knights left the field that evening without a word to {actor}.',
          changes: [
            {
              id: 'tourney.sac.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              title: 'A House in Debt',
              detail: '{cast:heir} owes {actor} a favour now.',
              concepts: [
                {
                  text: '{cast:heir}',
                  entityId: '$cast:heir',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'tourney.sac.festival',
              kind: 'trait',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'Festival',
                entityId: 'trait.condition.location.festival',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'Festival',
                  entityId: 'trait.condition.location.festival',
                  visualKind: 'attachment',
                },
              ],
              title: 'A Feast for the Field',
              detail: '{location} keeps the tourney\'s last day as a feast.',
            },
            {
              id: 'tourney.sac.regard',
              kind: 'reputation',
              category: 'boon',
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
          reactions: [
            {
              id: 'tourney.sac.honour_the_order',
              label: 'Give the order its honour',
              intent: 'Announce that the champion lowered the sword at the marshal\'s word. The champion will remember '
                + 'it, and the young noble\'s house will not like it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:champion',
                  sentimentDelta: 0.1,
                },
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:heir',
                  sentimentDelta: -0.05,
                },
              ],
            },
            {
              id: 'tourney.sac.call_a_draw',
              label: 'Call the bout a draw',
              intent: 'Announce that neither fighter yielded and neither lost. The noble\'s family thinks better of the '
                + 'mortal, and the champion takes it as a slight.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:heir',
                  sentimentDelta: 0.08,
                },
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:champion',
                  sentimentDelta: -0.06,
                },
              ],
            },
          ],
        },
        failure: {
          overview: 'The heralds closed the lists, and the order rode out of {location} calling the bout won. The '
            + 'town made {actor} marshal to stop exactly this.',
          changes: [
            {
              id: 'tourney.f.wounded',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'Wounded',
                entityId: 'trait.condition.wounded',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'Wounded',
                  entityId: 'trait.condition.wounded',
                  visualKind: 'attachment',
                },
              ],
              title: 'Maimed in the Lists',
              detail: '{cast:heir} is Wounded from the bout.',
            },
            {
              id: 'tourney.f.regard',
              kind: 'reputation',
              category: 'scar',
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
            {
              id: 'tourney.f.heir',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
              title: 'The House\'s Trust',
              detail: '{cast:heir} trusts {actor} less.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:heir',
                visualKind: 'agent',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'trusts',
                  tooltipId: 'ui.reputation_with',
                },
              ],
            },
          ],
          reactions: [
            {
              id: 'tourney.f.carry_to_healers',
              label: 'Carry the young noble to the healers',
              intent: 'The mortal stays with the house until the healers are done. The house will remember who stayed.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:heir',
                  sentimentDelta: 0.1,
                },
              ],
            },
            {
              id: 'tourney.f.ask_about_doctrine',
              label: 'Ask the champion about the doctrine',
              intent: 'The mortal asks the order\'s champion what the doctrine holds to, and keeps the answer.',
              effects: [
                {
                  kind: 'intelligence',
                  category: 'cultural_knowledge',
                  label: 'The Order\'s Doctrine',
                  detail: 'The order fights a grudge bout until one fighter yields, and counts no marshal\'s word above '
                    + 'that.',
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview: '{cast:heir} was carried off the field more dead than alive. The young noble\'s house told the '
            + 'whole town that its marshal could not keep the lists.',
          changes: [
            {
              id: 'tourney.cf.regard',
              kind: 'reputation',
              category: 'scar',
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
              title: 'Lost Before the Town',
              detail: '{location} thinks less of {actor} now.',
            },
            {
              id: 'tourney.cf.heir',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
              title: 'The House\'s Trust',
              detail: '{cast:heir} trusts {actor} less.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:heir',
                visualKind: 'agent',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'trusts',
                  tooltipId: 'ui.reputation_with',
                },
              ],
            },
          ],
          reactions: [
            {
              id: 'tourney.cf.carry_to_healers',
              label: 'Carry the young noble to the healers',
              intent: 'The mortal stays with the house until the healers are done. The house will remember who stayed.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:heir',
                  sentimentDelta: 0.1,
                },
              ],
            },
            {
              id: 'tourney.cf.ask_about_doctrine',
              label: 'Ask the champion about the doctrine',
              intent: 'The mortal asks the order\'s champion what the doctrine holds to, and keeps the answer.',
              effects: [
                {
                  kind: 'intelligence',
                  category: 'cultural_knowledge',
                  label: 'The Order\'s Doctrine',
                  detail: 'The order fights a grudge bout until one fighter yields, and counts no marshal\'s word above '
                    + 'that.',
                },
              ],
            },
          ],
        },
      },
    },
  },
  description: 'A knightly order is fighting a grudge bout against a young noble who will not yield. The '
    + 'tourney\'s marshal has to hold the lists and make the order\'s champion lower the sword before '
    + 'the bout ends in a killing.',
  locationSubtypes: expandSettings(['urban']),
  consequenceDraw: ['condition', 'secret'],
};

export const TOURNEY_MARSHAL_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
