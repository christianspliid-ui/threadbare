/**
 * The Bloodletting Hour (slug bloodletting-hour) - slot 6 of master-everyday-3 (THR-1840), test & consequence.
 * 
 * Brief: `Docs/plans/encounters/master-everyday-3-brief.md` (slot 6, binding).
 * Pipeline: `bloodletting-hour-draft.md` -> `-editorial.md` -> `-revised.md` -> `-systems.md` -> `-final.md` -> `-package.md`.
 * plotHookRolled: hook.artifact_recovery, hook.shifting_shape, hook.relic_awakening
 * plotHookTaken:  hook.shifting_shape - drifted: the illness is not the shape it shows. The household calls it a
 *                 fever; at the bedside the master finds a canker under the bishop's ribs that the chapter was
 *                 never told of. artifact_recovery and relic_awakening fought the fiction (nothing is lost or
 *                 woken in a sickroom).
 * Seed dice: p3 contest (the master's figure against the college's hour) - opposition faction (orders: the
 *            physicians' college bleeds a fever at once) - disposition neutral (the household wants the bishop
 *            well, by whichever art works) - agentRole trespasser (an astrologer at a physicians' bedside) -
 *            scale region (the diocese's bishop; the template field stays `local`, per the brief) - system
 *            items (advisory; nothing item-shaped fits a bleeding, not wired). Rolled setting stronghold ->
 *            the bishop's palace, inside the town (brief override).
 * 
 * --- Mechanical design block (designed before the prose) ---
 *   Crux            The bishop's physicians mean to bleed him at once, and his household has sent for {actor}
 *                   to cast the figure that says when a bleeding is safe.
 *   Whose problem?  The agent's: their figure, their bedside, their name as the master the palace sent for.
 *                   Scene-local; no prior tie to the bishop asserted (rule 7).
 *   Reach = theme?  Star throughout. Step 0 (0.74) casts the moon's sign and hour for the bleeding. Step 1
 *                   (0.82) holds the physicians to that hour at the bedside. Mean 0.78, window fit 0.92
 *                   (master). Words: severe, severe.
 *   Shape           Test & consequence on a linear two-step. Step 0 continue_weakened; step 1 fail_action.
 *                   Step 1 inherits step 0 through carryoverFactorLines (no critical_failure row: a step-0
 *                   critical failure ends the action). Branch count 0.
 *   Consequence hand (binding, THR-1145): knowledge + secret - no swap.
 *     knowledge     intelligence political_secret on $actor, step 1 success: the canker under the bishop's
 *                   ribs. BOON chip (knowledge).
 *     secret        favor_creation debtor $cast:bishop, step 1 success: the master keeps the canker from the
 *                   chapter. BOND chip (a favour owed). hidden_mark concealed_action on $cast:physician, step 1
 *                   failure: he bled against the figure and laid the blame on the astrologer. Unchipped (a
 *                   hidden mark is hidden; the poisoned-feast precedent).
 *   Extras          reputation_with $here +0.06 step 1 success, -0.06 step 1 failure, -0.03 step 0 failure
 *                   (backs the critical_failure SCAR on the step-0 route).
 *   Cool failure?   Nobody is killed, jailed or branded; the bishop lives on every band. The cost is the
 *                   master's name: the palace asks the physicians, not the master, when to bleed.
 *   Trait hooks     Gate: none. Variant: none - the figure is the sky and the sums; no live trait reads
 *                   either better than the reach does. Trait-only nudge: none. Trait fragment: none.
 *   Systems quota   cast (physician, bishop) - knowledge (intelligence) - secrets (favour, hidden mark) -
 *                   reputation.
 *   Cards           Step 0: Remember The Nights (Signature, time), Fix The Sums (Signature, order) + deal 3.
 *                   Step 1: Blunt The Blade (Signature, matter, opposes physician), Warm The Chamber
 *                   (Signature, energy) + deal 3. No libraryCardId bound; no Heavy Hand; no rider. Spheres
 *                   avoid both star masters (darkness, force, entropy, life, spirit, mind, chaos, light).
 *   Known gap       A step-1 critical_failure writes the physician's hidden mark, but the critical_failure band
 *                   is also reached by a step-0 critical failure that writes nothing, so no chip claims it.
 * 
 * --- The narrator's 12 questions, answered ---
 *   1 P1 arrival?      {actor} arrives at the bishop's palace in {location}, sent for by his household.
 *   2 P2 events?       The bishop has a fever; his physicians mean to bleed him; a bleeding at the wrong hour
 *                      of the moon kills; {cast:physician} says the fever cannot wait.
 *   3 P3 one stake?    Contest: the household asks for the figure; the college will not wait for it.
 *   4 <=80 words?      Opening 14 + spine 63 = 77.
 *   5 Read aloud?      Every sentence is a report.
 *   6 Stated?          The fever, the rule of the hour, the physician's refusal to wait.
 *   7 Every sentence works? Challenge, test or outcome.
 *   8 Nothing unintroduced? The moon, the almanac and the physician precede step 0's cards; the basin,
 *                      the blade and the bedside precede step 1's.
 *   9 One named person? {cast:physician} on both spines; {cast:bishop} named in the step-0 spine.
 *  10 Stake in a sentence? 'Can the master cast the figure and hold the physicians to its hour, and keep
 *                      their name?'
 *  11 Cards verb+noun? Remember, Fix, Blunt, Warm - all in the lexicon; no effect line repeats a word of
 *                      its name; no digits.
 *  12 Opening per class? urban, the only class, written.
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
  id: 'encounter.town.bloodletting_hour',
  stakes: {
    goal: 'cast the figure and hold the physicians to its hour',
    risk: 'have a wrong sum found in the figure at the bedside',
    won: 'cast the figure and held the physicians to its hour',
    lost: 'could not stop the physicians bleeding the bishop early',
    lostBadly: 'had a wrong sum found in the figure at the bedside',
  },
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Bloodletting Hour',
  reach: 'star',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['revelation_discretion', 'tradition_novelty'],
  settings: ['urban'],
  openings: {
    urban: '{actor} arrives at the bishop\'s palace in {location}, sent for by his household.',
  },
  steps: [
    {
      reach: 'star',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.74,
      purposeLine: 'Cast the figure',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The bishop, {cast:bishop}, has a fever, and his physicians mean to bleed him. By the art they '
        + 'all follow, a bleeding at the wrong hour of the moon kills. The senior physician, '
        + '{cast:physician}, says the fever cannot wait for the stars.\n\n'
        + 'The household asks {actor} to cast the figure for the bleeding: the moon\'s sign and the safe '
        + 'hour, from the tables in the household\'s almanac.',
      criticalSuccessAfterimage: 'They cast the figure to the quarter hour. The moon leaves the sign that rules the heart at dawn, '
        + 'and dawn is the hour to bleed.',
      successAfterimage: 'The figure gives dawn tomorrow, when the moon leaves the sign that rules the heart.',
      successAtCostAfterimage: 'The figure gives dawn tomorrow, but casting it took most of the night, and the bishop\'s fever '
        + 'rose while they worked.',
      failureAfterimage: 'Their almanac\'s moon tables ended at midsummer, and the figure could say only that tonight is '
        + 'wrong.',
      criticalFailureAfterimage: 'They set the moon in the wrong sign, and {cast:physician} saw the mistake on the figure before '
        + 'they did.',
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
        tags: ['lore', 'insight'],
      },
      nudges: [
        {
          id: 'bleeding.remember_the_nights',
          name: 'Remember The Nights',
          sphere: 'time',
          essenceCost: 2,
          forecastDelta: 0.11,
          imageTag: 'generic.memory',
          effectLine: 'Bring every moonrise of the past month back to their mind, so the moon\'s path through the signs '
            + 'is plain.',
          bandProse: {
            critical_success: 'Every moonrise of the month came back to them in order, and the moon\'s next sign was plain.',
            success: 'The month\'s moonrises came back to them, and they set the moon\'s course without the almanac.',
            near_miss: 'The moonrises came back to them, all but the two cloudy nights in the middle of the month.',
            failure: 'The moonrises came back to them, but a month of moons could not tell them the hour.',
          },
        },
        {
          id: 'bleeding.fix_the_sums',
          name: 'Fix The Sums',
          sphere: 'order',
          essenceCost: 1,
          forecastDelta: 0.08,
          imageTag: 'generic.focus',
          effectLine: 'Set every number in their almanac in its right column, so nothing is carried wrong.',
          bandProse: {
            success_at_cost: 'Every column added up, but they checked each one twice before they trusted it.',
            failure: 'Every column added up, but the almanac\'s own figures were copied wrong.',
            critical_failure: 'Every column added up, and they trusted it, and never checked which sign they had started from.',
          },
        },
      ],
    },
    {
      reach: 'star',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.82,
      purposeLine: 'Hold the hour',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: '{cast:physician} speaks for the physicians\' college. He stands at the bishop\'s bed, by the '
        + 'fire, with the basin and the blade.\n\n'
        + 'The household will let {actor} argue the figure\'s hour at the bedside. The college bleeds a '
        + 'fever at once, and will bleed the bishop now unless {actor} holds them to it. A master who '
        + 'cannot hold a bedside loses the trust of {location}.',
      criticalSuccessAfterimage: 'The physicians waited for dawn, the bishop was bled at the hour, and by noon his fever had '
        + 'broken. At the bedside {actor} saw a hard swelling under his ribs, and kept quiet about it.',
      successAfterimage: 'The physicians waited for dawn, and the bishop was bled at the hour the figure gave. His fever '
        + 'broke by evening. At the bedside {actor} saw a hard swelling under his ribs, and kept quiet '
        + 'about it.',
      successAtCostAfterimage: 'The physicians waited for dawn, but {cast:physician} told the college that {actor} had overruled '
        + 'a physician at a sickbed. At the bedside {actor} saw a hard swelling under the bishop\'s ribs, '
        + 'and kept quiet about it.',
      failureAfterimage: '{cast:physician} bled the bishop at once, against the figure. The bishop is weaker, and the '
        + 'college says the astrologer only delayed them.',
      criticalFailureAfterimage: '{cast:physician} found a wrong sum in {actor}\'s figure and read it out at the bedside. He bled '
        + 'the bishop at once, and the household believed him.',
      carryoverFactorLines: {
        critical_success: {
          text: 'They can name the bleeding hour to the quarter.',
          polarity: 'for',
          forecastDelta: 0.05,
        },
        success: {
          text: 'Their figure gives the hour plainly.',
          polarity: 'for',
          forecastDelta: 0.03,
        },
        success_at_cost: {
          text: 'The fever rose while the figure was cast.',
          polarity: 'against',
          forecastDelta: -0.02,
        },
        near_miss: {
          text: 'Their figure gives the night, not the hour.',
          polarity: 'for',
          forecastDelta: 0.01,
        },
        failure: {
          text: 'Their figure says only when not to bleed.',
          polarity: 'against',
          forecastDelta: -0.03,
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
            kind: 'intelligence',
            category: 'political_secret',
            label: 'The bishop\'s hidden illness',
            detail: 'A hard swelling under the bishop\'s ribs: a canker his household has kept from the cathedral '
              + 'chapter.',
            reliability: 0.8,
            targetAgentId: '$actor',
          },
          {
            kind: 'favor_creation',
            magnitudeRange: [0.15, 0.3],
            context: 'Kept the canker under the bishop\'s ribs from the cathedral chapter',
            debtorAgentId: '$cast:bishop',
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
            severity: 0.5,
            label: 'Bled the bishop against the figure and laid the blame on the astrologer',
            targetAgentId: '$cast:physician',
          },
        ],
      },
      deal: {
        count: 3,
        tags: ['social', 'presence'],
      },
      nudges: [
        {
          id: 'bleeding.blunt_the_blade',
          name: 'Blunt The Blade',
          sphere: 'matter',
          essenceCost: 2,
          forecastDelta: 0.1,
          opposes: 'physician',
          imageTag: 'generic.matter',
          effectLine: 'Dull an edge in the room, so it will not open a vein until it is honed again.',
          bandProse: {
            critical_success: 'The edge would not open the vein, and by the time it was honed the hour had come.',
            success: 'The edge slid off the bishop\'s arm, and {cast:physician} sent for a whetstone.',
            near_miss: 'The edge would not cut, but a younger physician had his own ready.',
            failure: 'The edge was dull, and {cast:physician} honed it at the bedside in a few strokes.',
          },
        },
        {
          id: 'bleeding.warm_the_chamber',
          name: 'Warm The Chamber',
          sphere: 'energy',
          essenceCost: 1,
          forecastDelta: 0.07,
          imageTag: 'generic.warmth',
          effectLine: 'Keep a fire high and steady through the night, so a fever eases while the sick wait.',
          bandProse: {
            success_at_cost: 'The fire held all night and the bishop slept, but the physicians called the heat an '
              + 'astrologer\'s meddling.',
            failure: 'The fire held all night, but the bishop\'s fever did not ease.',
            critical_failure: 'The fire burned so high that the bishop woke soaked, and {cast:physician} said he could wait no '
              + 'longer.',
          },
        },
      ],
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'physician',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['healer'],
      supportRole: 'senior physician of the college',
      spawnNpcRole: 'healer',
      spawnName: 'Anselm Crewe',
    },
    {
      kind: 'actor',
      key: 'bishop',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      supportRole: 'bishop',
      spawnNpcRole: 'priest',
      spawnName: 'Walter Hamond',
    },
  ],
  narrativeTemplates: {
    initiation: 'The bishop of {location} is to be bled, and his household has sent for {actor} to cast the '
      + 'figure.',
    success: 'The bishop was bled at the hour the figure gave.',
    failure: 'The bishop was bled before the hour.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The bishop of {location} has been bled.',
      changes: [],
      reactions: [],
      byOutcome: {
        critical_success: {
          overview: 'The bishop is sitting up, and the household will ask {actor} for the hour of every bleeding now.',
          changes: [
            {
              id: 'bleeding.crit.regard',
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
              title: 'The hour held',
              causeClause: 'Word from the palace',
              detail: '{location} thinks well of {actor}.',
            },
            {
              id: 'bleeding.crit.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              concepts: [
                {
                  text: '{cast:bishop}',
                  entityId: '$cast:bishop',
                  visualKind: 'agent',
                },
              ],
              title: 'A favour owed',
              causeClause: 'Kept his secret',
              detail: '{cast:bishop} owes {actor} a favour.',
            },
            {
              id: 'bleeding.crit.knowledge',
              kind: 'shell_state',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'knowledge',
                tooltipId: 'ui.knowledge',
              },
              concepts: [
                {
                  text: 'the bishop\'s hidden illness',
                  tooltipId: 'ui.knowledge',
                },
              ],
              title: 'Seen at the bedside',
              causeClause: 'Under his ribs',
              detail: 'The swelling is a canker his chapter has not been told of.',
            },
          ],
          reactions: [
            {
              id: 'bleeding.cs.make_peace',
              label: 'Make peace with the college',
              intent: 'Grant the senior physician that his college\'s rule has saved lives before tonight. He thinks '
                + 'better of the mortal for it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:physician',
                  sentimentDelta: 0.08,
                  trustDelta: 0.04,
                },
              ],
            },
            {
              id: 'bleeding.cs.stand_by_the_art',
              label: 'Stand by the art',
              intent: 'Say plainly at the bedside that the stars rule a bleeding, not the college. The bishop trusts '
                + 'the mortal more, and the senior physician takes against them.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:bishop',
                  sentimentDelta: 0.06,
                  trustDelta: 0.04,
                },
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:physician',
                  sentimentDelta: -0.1,
                },
              ],
            },
          ],
        },
        success: {
          overview: 'The bishop\'s household trusts {actor}\'s figure over the college\'s haste.',
          changes: [
            {
              id: 'bleeding.win.regard',
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
              title: 'The hour held',
              causeClause: 'Word from the palace',
              detail: '{location} thinks well of {actor}.',
            },
            {
              id: 'bleeding.win.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              concepts: [
                {
                  text: '{cast:bishop}',
                  entityId: '$cast:bishop',
                  visualKind: 'agent',
                },
              ],
              title: 'A favour owed',
              causeClause: 'Kept his secret',
              detail: '{cast:bishop} owes {actor} a favour.',
            },
            {
              id: 'bleeding.win.knowledge',
              kind: 'shell_state',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'knowledge',
                tooltipId: 'ui.knowledge',
              },
              concepts: [
                {
                  text: 'the bishop\'s hidden illness',
                  tooltipId: 'ui.knowledge',
                },
              ],
              title: 'Seen at the bedside',
              causeClause: 'Under his ribs',
              detail: 'The swelling is a canker his chapter has not been told of.',
            },
          ],
          reactions: [
            {
              id: 'bleeding.s.make_peace',
              label: 'Make peace with the college',
              intent: 'Grant the senior physician that his college\'s rule has saved lives before tonight. He thinks '
                + 'better of the mortal for it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:physician',
                  sentimentDelta: 0.08,
                  trustDelta: 0.04,
                },
              ],
            },
            {
              id: 'bleeding.s.stand_by_the_art',
              label: 'Stand by the art',
              intent: 'Say plainly at the bedside that the stars rule a bleeding, not the college. The bishop trusts '
                + 'the mortal more, and the senior physician takes against them.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:bishop',
                  sentimentDelta: 0.06,
                  trustDelta: 0.04,
                },
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:physician',
                  sentimentDelta: -0.1,
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview: 'The bishop was bled at the hour, but the physicians\' college has not forgiven {actor} for '
            + 'overruling it.',
          changes: [
            {
              id: 'bleeding.cost.regard',
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
              title: 'The hour held',
              causeClause: 'Word from the palace',
              detail: '{location} still thinks well of {actor}.',
            },
            {
              id: 'bleeding.cost.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              concepts: [
                {
                  text: '{cast:bishop}',
                  entityId: '$cast:bishop',
                  visualKind: 'agent',
                },
              ],
              title: 'A favour owed',
              causeClause: 'Kept his secret',
              detail: '{cast:bishop} owes {actor} a favour.',
            },
            {
              id: 'bleeding.cost.knowledge',
              kind: 'shell_state',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'knowledge',
                tooltipId: 'ui.knowledge',
              },
              concepts: [
                {
                  text: 'the bishop\'s hidden illness',
                  tooltipId: 'ui.knowledge',
                },
              ],
              title: 'Seen at the bedside',
              causeClause: 'Under his ribs',
              detail: 'The swelling is a canker his chapter has not been told of.',
            },
          ],
          reactions: [
            {
              id: 'bleeding.sac.make_peace',
              label: 'Make peace with the college',
              intent: 'Grant the senior physician that his college\'s rule has saved lives before tonight. He thinks '
                + 'better of the mortal for it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:physician',
                  sentimentDelta: 0.08,
                  trustDelta: 0.04,
                },
              ],
            },
            {
              id: 'bleeding.sac.stand_by_the_art',
              label: 'Stand by the art',
              intent: 'Say plainly at the bedside that the stars rule a bleeding, not the college. The bishop trusts '
                + 'the mortal more, and the senior physician takes against them.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:bishop',
                  sentimentDelta: 0.06,
                  trustDelta: 0.04,
                },
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:physician',
                  sentimentDelta: -0.1,
                },
              ],
            },
          ],
        },
        failure: {
          overview: 'The college bled the bishop before the hour, and the palace now asks the physicians, not '
            + '{actor}, when to bleed.',
          changes: [
            {
              id: 'bleeding.lost.regard',
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
              title: 'Overruled',
              causeClause: 'Word from the palace',
              detail: '{location} thinks less of {actor}.',
            },
          ],
        },
        critical_failure: {
          overview: 'The household believes {actor} cast the figure wrong, and the palace will not send for them '
            + 'again.',
          changes: [
            {
              id: 'bleeding.broke.regard',
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
              title: 'A wrong figure',
              causeClause: 'Talk from the bedside',
              detail: '{location} thinks less of {actor}.',
            },
          ],
        },
      },
    },
  },
  description: 'The bishop is ill and his physicians mean to bleed him at once, though a bleeding at the wrong '
    + 'hour of the moon can kill. Someone has to cast the figure for the bleeding and hold the '
    + 'physicians to the hour it gives.',
  locationSubtypes: expandSettings(['urban']),
  consequenceDraw: ['knowledge', 'secret'],
};

export const BLOODLETTING_HOUR_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
