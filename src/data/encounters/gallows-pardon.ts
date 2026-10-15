/**
 * The Gallows Pardon (slug gallows-pardon) - slot 3 of master-everyday-3 (THR-1840), a seeded sequel.
 * 
 * Brief: `Docs/plans/encounters/master-everyday-3-brief.md`. Packet: `gallows-pardon-final.md`.
 * plotHookRolled: hook.the_great_building, hook.reconciliation, hook.rebuilding_trust
 * plotHookTaken:  hook.the_great_building - the whole town is building a new bridge, and the lead stolen
 *                 from the works is what a labourer's son is to hang for: the justice wants the works kept
 *                 honest, and a stone-carrier's life is the price of the example.
 * Seed dice: p3 unmitigated_risk (the youth hangs at noon unless someone stops it) - opposition beast
 *            (territory), read as the crowd that came for its hanging and the law's duty behind the justice -
 *            disposition open - agentRole trespasser (the master steps between the law and its sentence) -
 *            scale settlement - system carryover (step 1's carryover lines key on how the crowd was won).
 * Setting override: rolled wayside -> urban (brief); it survives as the gallows at the crossroads outside the gate.
 * 
 * --- The narrator's 12 questions, answered ---
 *   1 P1 arrival?      {actor} reaches the gallows at the crossroads outside {location}. Graph names.
 *   2 P2 events?       A youth from the bridge works is to hang at noon for stealing lead; half the town
 *                      thinks he did not; the rest have come to watch.
 *   3 P3 one stake?    Unmitigated risk (rolled): he hangs at noon unless someone stops it. {cast:mother} has
 *                      begged {actor} to speak; first the crowd must be won and the hangman held back.
 *   4 <=80 words?      72 (opening + step-0 spine).
 *   5 Read aloud?      Report throughout; no interior sensation, no camera work.
 *   6 Stated?          "{actor} must win the crowd over first, or the hangman will not wait for a plea."
 *   7 Every sentence works? Challenge, test or outcome.
 *   8 Nothing unintroduced? Youth, lead, works, crowd, mother and hangman in step 0; the justice, the
 *                      sentence and the lead under the bed in step 1's spine before its hand.
 *   9 One named person? Step 0 names {cast:mother}; step 1 names {cast:justice}. The youth stays a role
 *                      noun on purpose: he may hang, and a hanged cast member would persist in the graph.
 *  10 Stake in a sentence? Can {actor} win the youth a pardon at the gallows before noon?
 *  11 Cards verb+noun? Soften Hard Hearts, Slow The Hour, Press The Conscience, Find The Right Words.
 *  12 Opening per class? urban, written.
 * 
 * --- Mechanical design block ---
 *   Crux            A youth is to hang at noon for a theft half the town thinks he did not do, and his
 *                   mother has begged {actor} to speak for him before a crowd that wants its hanging.
 *   Shape           Seeded Sequel (placeless) on Danger - Confrontation. heart 0.76 (continue_weakened) ->
 *                   heart 0.80 (fail_action). Linear, branch count 0. Mean 0.78, window fit 0.92 (master).
 *                   Step 1's carryover lines key on the band step 0 rolled (how the crowd was left).
 *   Consequence hand (binding): relationship + story_seed, no swap.
 *                   relationship - bond_change $cast:mother: -0.06 on step 0 failure, +0.12 / -0.12 on step 1
 *                   success / failure. bond_change $cast:justice -0.08 sentiment on step 1 success: the
 *                   justice was argued down before the town (the s@c row's enemy, carried on every success
 *                   band, as hostage_exchange carries its captain).
 *                   story_seed - placeless encounter_seed query #fellowship_errand, delay 36, on step 1 success AND
 *                   step 1 failure: the youth, spared or not, has people - the builders he carried stone for -
 *                   and they send {actor} work. Critic fix: #tavern_night was unreachable from a placeless seed
 *                   (all ten members gate on sublocation-type.tavern; the seeding site judges the Location tier).
 *                   #fellowship_errand: 5 members, all accept town/city/capital = urban. Label promises only work.
 *   Standing        reputation_with $here +0.06 / -0.06 on step 1; -0.02 on step 0 failure (backs the
 *                   critical_failure town chip when a step-0 critical failure ends the action).
 *   Chips (THR-1685) Person bond chips use the plain noun `reputation` with the cast member as a concept
 *                   anchor, no {target}. Town chips anchor `reputation with {location}` on $here.
 *   Known gap       A step-0 critical failure ends the action and plants no seed, so the critical_failure
 *                   band carries no PATH chip (an omission, never a false chip).
 *   Tone            Ends warm on the success side: the youth lives, the rope hangs empty, and the master
 *                   may walk him home to his mother (reaction).
 *   Cool failure    Nobody kills, jails or brands the master. The youth hangs, stated plainly. The cost to
 *                   the master is the name: a master's plea was meant to carry the justice, and it did not.
 *   Cost channels   Specials essence-priced except the Silver Tongue trait card (cost 0). No Heavy Hand, no
 *                   rider, no grants, no over-exposed library card as a special.
 *   Expert collision Heart masters: granary_riot (rule at a riot), hostage_exchange (broker a handover).
 *                   Experts: feud_mediation, inheritance_wake. This verb: plead a condemned life at the gallows.
 * 
 *   Cold critic     editorial/systems/package 2026-10-15: see gallows-pardon-editorial.md section 9.
 * 
 * --- Trait hooks (mandatory four questions) ---
 *   Gate? No - everyday board, no rule gates by brief. Variant? Yes - Silver Tongue (trait.mastery.silver-tongue)
 *   +0.05 and Bitter (trait.core.core_hope.vice) -0.04. Trait-only nudge? Yes - gallows.find_the_right_words
 *   on step 1, cost 0, unlocked by Silver Tongue. Trait fragment? The trait card's own band fragments.
 * 
 * --- Hands ---
 *   Step 0: Signature spirit (Soften Hard Hearts) + Long Game time (Slow The Hour), deal 3 presence/social.
 *   Step 1: Whisper mind (Press The Conscience) + Trait card (Silver Tongue, Find The Right Words),
 *           deal 3 social/insight.
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
  id: 'encounter.town.gallows_pardon',
  stakes: {
    goal: 'win a pardon for the youth at the gallows',
    risk: 'be blamed for the youth\'s hanging',
    won: 'won a pardon for the youth at the gallows',
    lost: 'pleaded for the youth and saw him hang at noon',
    lostBadly: 'was blamed for the youth\'s hanging',
  },
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Gallows Pardon',
  reach: 'heart',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['mercy_ruthlessness'],
  settings: ['urban'],
  openings: {
    urban: '{actor} reaches the gallows at the crossroads outside {location} at mid-morning.',
  },
  steps: [
    {
      reach: 'heart',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.76,
      purposeLine: 'Turn the crowd',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'A youth who carried stone on the new bridge is to hang at noon for stealing lead from the works. '
        + 'Half the town thinks he did not do it. The rest have come to watch.\n\n'
        + '{cast:mother}, his mother, has begged {actor} to speak for him. {actor} must win the crowd over '
        + 'first, or the hangman will not wait for a plea.',
      criticalSuccessAfterimage: 'The crowd fell silent, and voices in it called for the youth to be heard. The hangman stepped '
        + 'back from the rope.',
      successAfterimage: 'The crowd went quiet enough to hear a plea, and the hangman stepped back to wait.',
      successAtCostAfterimage: 'The hangman stepped back to wait, but the crowd jeered {actor} as the thief\'s friend.',
      failureAfterimage: 'The crowd shouted {actor} down, and {cast:mother} stopped believing {actor} could save her son.',
      criticalFailureAfterimage: 'The crowd shouted {actor} down, and the hangman did not wait for a plea. The youth hanged at '
        + 'noon.',
      failureMetadata: {
        effects: [
          {
            kind: 'bond_change',
            withAgentId: '$cast:mother',
            sentimentDelta: -0.06,
            trustDelta: -0.06,
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
        tags: ['presence', 'social'],
      },
      nudges: [
        {
          id: 'gallows.soften_hard_hearts',
          name: 'Soften Hard Hearts',
          sphere: 'spirit',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.warmth',
          effectLine: 'Turn a crowd\'s appetite for punishment toward pity, so it will hear a plea before it shouts.',
          bandProse: {
            critical_success: 'People at the front began to call the youth by his name, and the shouting stopped.',
            success: 'The shouting died down, and people began to look at the youth instead of the rope.',
            near_miss: 'The crowd quieted, but not until the noon bell was nearly due.',
            failure: 'The crowd pitied the mother out loud, and still called for the rope.',
          },
        },
        {
          id: 'gallows.slow_the_hour',
          name: 'Slow The Hour',
          sphere: 'time',
          essenceCost: 2,
          forecastDelta: 0.08,
          imageTag: 'generic.memory',
          effectLine: 'Stretch the last moments before a deadline, so there is time for one more voice to be heard.',
          bandProse: {
            success: 'The bell-ringer was late to the bell, and {actor} had time to be heard.',
            success_at_cost: 'The bell rang late, and the crowd blamed {actor} for keeping them waiting.',
            failure: 'The bell rang late, and the crowd spent the wait shouting {actor} down.',
            critical_failure: 'The bell rang late, and the hangman went ahead without it.',
          },
        },
      ],
    },
    {
      reach: 'heart',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.8,
      purposeLine: 'Win the pardon',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: '{cast:justice}, the lord\'s justice, stands on the gallows steps holding the sentence. The lead '
        + 'was found under the youth\'s bed, and the town wants the bridge works kept honest.\n\n'
        + '{cast:justice} will hear one plea before giving the word. {actor} must win a pardon from '
        + '{cast:justice}, or the youth hangs.',
      criticalSuccessAfterimage: '{cast:justice} tore up the sentence on the steps and ordered the bridge works searched again.',
      successAfterimage: '{cast:justice} pardoned the youth, and the hangman cut his hands free.',
      successAtCostAfterimage: '{cast:justice} pardoned the youth, but told the crowd the pardon went against the court\'s '
        + 'judgement.',
      failureAfterimage: '{cast:justice} heard the plea and gave the word. The youth hanged at noon.',
      criticalFailureAfterimage: '{cast:justice} took the plea as an insult to the lord\'s court and gave the word at once. The '
        + 'youth hanged at noon, in front of {cast:mother}.',
      carryoverFactorLines: {
        critical_success: {
          text: 'The crowd is calling for the youth to be heard.',
          polarity: 'for',
          forecastDelta: 0.06,
        },
        success: {
          text: 'The crowd is quiet and willing to listen.',
          polarity: 'for',
          forecastDelta: 0.04,
        },
        success_at_cost: {
          text: 'The crowd jeers whoever speaks for the youth.',
          polarity: 'against',
          forecastDelta: -0.02,
        },
        near_miss: {
          text: 'The crowd went quiet only just before noon.',
          polarity: 'against',
          forecastDelta: -0.03,
        },
        failure: {
          text: 'The crowd shouted the last speaker down.',
          polarity: 'against',
          forecastDelta: -0.05,
        },
      },
      successMetadata: {
        effects: [
          {
            kind: 'bond_change',
            withAgentId: '$cast:mother',
            sentimentDelta: 0.12,
            trustDelta: 0.1,
          },
          {
            kind: 'bond_change',
            withAgentId: '$cast:justice',
            sentimentDelta: -0.08,
            trustDelta: -0.04,
          },
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: 0.06,
          },
          {
            kind: 'encounter_seed',
            query: {
              kind: 'encounter_template',
              tags: ['#fellowship_errand'],
            },
            targetAgentId: '$actor',
            delayTicks: 36,
            priority: 0.8,
            seedLabel: 'The builders who worked beside the youth heard {actor} speak for him at the gallows, and have '
              + 'work for them.',
          },
        ],
      },
      failureMetadata: {
        effects: [
          {
            kind: 'bond_change',
            withAgentId: '$cast:mother',
            sentimentDelta: -0.12,
            trustDelta: -0.1,
          },
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: -0.06,
          },
          {
            kind: 'encounter_seed',
            query: {
              kind: 'encounter_template',
              tags: ['#fellowship_errand'],
            },
            targetAgentId: '$actor',
            delayTicks: 36,
            priority: 0.8,
            seedLabel: 'The builders who worked beside the youth heard {actor} speak for him at the gallows, and have '
              + 'work for them.',
          },
        ],
      },
      deal: {
        count: 3,
        tags: ['social', 'insight'],
      },
      nudges: [
        {
          id: 'gallows.press_the_conscience',
          name: 'Press The Conscience',
          sphere: 'mind',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.focus',
          effectLine: 'Lay the weight of a sentence on the one who must give it, so they hear the whole plea before '
            + 'deciding.',
          bandProse: {
            critical_success: '{cast:justice} stopped the hangman and asked to see the lead and the youth\'s bed.',
            success: '{cast:justice} heard the plea to the end without once looking at the hangman.',
            near_miss: '{cast:justice} heard the plea out, but kept hold of the sentence a long while.',
            failure: '{cast:justice} heard every word of the plea, and gave the word anyway.',
          },
        },
        {
          id: 'gallows.find_the_right_words',
          libraryCardId: 'card.trait_card.core',
          name: 'Find The Right Words',
          requiredTrait: 'trait.mastery.silver-tongue',
          essenceCost: 0,
          forecastDelta: 0.08,
          imageTag: 'generic.mercy',
          effectLine: 'Shape a plea the listener cannot wave away, so even a hard judge has to answer it.',
          bandProse: {
            success: '{actor} put the case in three plain sentences, and {cast:justice} had no answer to them.',
            failure: '{actor} pleaded well, and {cast:justice} said a fine speech did not put the lead back.',
          },
        },
      ],
    },
  ],
  traitVariants: [
    {
      traitId: 'trait.mastery.silver-tongue',
      forecastDelta: 0.05,
      factorLine: 'Having a Silver Tongue, they are heard out when they plead.',
      addNudgeIds: ['gallows.find_the_right_words'],
    },
    {
      traitId: 'trait.core.core_hope.vice',
      forecastDelta: -0.04,
      factorLine: 'Being Bitter, they expect the rope to win before they begin.',
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'mother',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      supportRole: 'condemned_youths_mother',
      spawnNpcRole: 'weaver',
      spawnName: 'Agnes Thorne',
    },
    {
      kind: 'actor',
      key: 'justice',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['noble', 'steward'],
      supportRole: 'lords_justice',
      spawnNpcRole: 'noble',
      spawnName: 'Sir Walter Greve',
    },
  ],
  narrativeTemplates: {
    initiation: 'A youth is to hang at the crossroads gallows outside {location}, and his mother has begged '
      + '{actor} to speak for him.',
    success: 'The youth was pardoned at the gallows.',
    failure: 'The youth hanged at noon.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The crowd leaves the crossroads gallows, and {location} talks about the plea.',
      changes: [],
      reactions: [
        {
          id: 'gallows.walk_the_youth_home',
          label: 'Walk the youth home',
          intent: 'The mortal walks the youth to his mother\'s door through the staring town. She will remember it.',
          effects: [
            {
              kind: 'bond_change',
              withAgentId: '$cast:mother',
              sentimentDelta: 0.04,
            },
          ],
        },
        {
          id: 'gallows.credit_the_justice',
          label: 'Give the justice the credit',
          intent: 'The mortal tells the crowd the pardon was the justice\'s own mercy. The justice will remember '
            + 'the courtesy.',
          effects: [
            {
              kind: 'bond_change',
              withAgentId: '$cast:justice',
              sentimentDelta: 0.04,
            },
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          overview: 'The youth lives, and the whole town knows who spoke for him at the gallows.',
          changes: [
            {
              id: 'gallows.crit.town_thanks',
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
                  text: 'thinks better of',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Town\'s Thanks',
              detail: '{location} thinks better of {actor} now.',
            },
            {
              id: 'gallows.crit.mother_trust',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'reputation',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{cast:mother}',
                  entityId: '$cast:mother',
                  visualKind: 'agent',
                },
                {
                  text: 'trusts',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Mother\'s Trust',
              detail: '{cast:mother} trusts {actor} now.',
            },
            {
              id: 'gallows.crit.justice_grudge',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'reputation',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{cast:justice}',
                  entityId: '$cast:justice',
                  visualKind: 'agent',
                },
                {
                  text: 'resents',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Justice\'s Grudge',
              detail: '{cast:justice} resents being argued down before the town.',
            },
            {
              id: 'gallows.crit.youths_people',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
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
              title: 'The Builders\' Work',
              detail: 'The builders who worked beside the youth will send {actor} work.',
            },
          ],
        },
        success: {
          overview: 'The youth lives, and the rope at the crossroads hangs empty.',
          changes: [
            {
              id: 'gallows.win.town_thanks',
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
                  text: 'thinks better of',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Town\'s Thanks',
              detail: '{location} thinks better of {actor} now.',
            },
            {
              id: 'gallows.win.mother_trust',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'reputation',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{cast:mother}',
                  entityId: '$cast:mother',
                  visualKind: 'agent',
                },
                {
                  text: 'trusts',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Mother\'s Trust',
              detail: '{cast:mother} trusts {actor} now.',
            },
            {
              id: 'gallows.win.justice_grudge',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'reputation',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{cast:justice}',
                  entityId: '$cast:justice',
                  visualKind: 'agent',
                },
                {
                  text: 'resents',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Justice\'s Grudge',
              detail: '{cast:justice} resents being argued down before the town.',
            },
            {
              id: 'gallows.win.youths_people',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
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
              title: 'The Builders\' Work',
              detail: 'The builders who worked beside the youth will send {actor} work.',
            },
          ],
        },
        success_at_cost: {
          overview: 'The youth lives, though not everyone in {location} believes he is innocent.',
          changes: [
            {
              id: 'gallows.cost.town_thanks',
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
                  text: 'thinks better of',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Town\'s Thanks',
              detail: '{location} thinks better of {actor} now.',
            },
            {
              id: 'gallows.cost.mother_trust',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'reputation',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{cast:mother}',
                  entityId: '$cast:mother',
                  visualKind: 'agent',
                },
                {
                  text: 'trusts',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Mother\'s Trust',
              detail: '{cast:mother} trusts {actor} now.',
            },
            {
              id: 'gallows.cost.justice_grudge',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'reputation',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{cast:justice}',
                  entityId: '$cast:justice',
                  visualKind: 'agent',
                },
                {
                  text: 'resents',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Justice\'s Grudge',
              detail: '{cast:justice} resents being argued down before the town.',
            },
            {
              id: 'gallows.cost.youths_people',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
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
              title: 'The Builders\' Work',
              detail: 'The builders who worked beside the youth will send {actor} work.',
            },
          ],
        },
        failure: {
          overview: '{cast:mother} has lost her son. A master\'s plea was meant to move the justice, and this one did '
            + 'not.',
          changes: [
            {
              id: 'gallows.fail.town_regard',
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
              title: 'A Plea That Failed',
              detail: '{location} thinks less of {actor} now.',
            },
            {
              id: 'gallows.fail.mother_blame',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'reputation',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{cast:mother}',
                  entityId: '$cast:mother',
                  visualKind: 'agent',
                },
                {
                  text: 'blames',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Mother\'s Blame',
              detail: '{cast:mother} blames {actor} for her son.',
            },
            {
              id: 'gallows.fail.youths_people',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
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
              title: 'The Builders\' Work',
              detail: 'The builders who worked beside the youth will send {actor} work.',
            },
          ],
          reactions: [
            {
              id: 'gallows.fail.stay_with_the_mother',
              label: 'Stay with the mother',
              intent: 'The mortal stays at the gallows with the mother until the crowd is gone. She will remember that '
                + 'much.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:mother',
                  sentimentDelta: 0.04,
                },
              ],
            },
            {
              id: 'gallows.fail.name_him_innocent',
              label: 'Say he was innocent',
              intent: 'The mortal tells the town the youth never stole the lead. The town will not thank them for it.',
              effects: [
                {
                  kind: 'reputation_with',
                  targetLocationId: '$here',
                  delta: -0.03,
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview: '{cast:mother} has lost her son, and the crowd went home saying {actor} only hurried the rope.',
          changes: [
            {
              id: 'gallows.critfail.town_regard',
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
              title: 'Blamed for the Rope',
              detail: '{location} thinks less of {actor} now.',
            },
            {
              id: 'gallows.critfail.mother_blame',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'reputation',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{cast:mother}',
                  entityId: '$cast:mother',
                  visualKind: 'agent',
                },
                {
                  text: 'blames',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Mother\'s Blame',
              detail: '{cast:mother} blames {actor} for her son.',
            },
          ],
          reactions: [
            {
              id: 'gallows.critfail.stay_with_the_mother',
              label: 'Stay with the mother',
              intent: 'The mortal stays at the gallows with the mother until the crowd is gone. She will remember that '
                + 'much.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:mother',
                  sentimentDelta: 0.04,
                },
              ],
            },
            {
              id: 'gallows.critfail.name_him_innocent',
              label: 'Say he was innocent',
              intent: 'The mortal tells the town the youth never stole the lead. The town will not thank them for it.',
              effects: [
                {
                  kind: 'reputation_with',
                  targetLocationId: '$here',
                  delta: -0.03,
                },
              ],
            },
          ],
        },
      },
    },
  },
  description: 'A youth is to hang at noon at the crossroads gallows for stealing lead from the bridge works, '
    + 'and half the town thinks he did not do it. Someone has to turn the crowd that came to watch, '
    + 'then plead for his life before the lord\'s justice.',
  locationSubtypes: expandSettings(['urban']),
  consequenceDraw: ['relationship', 'story_seed'],
};

export const GALLOWS_PARDON_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
