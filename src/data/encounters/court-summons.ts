/**
 * The Crown's Summons — slot 1 of the realm-court batch (THR-1454), the first
 * content authored against the `$realm` sentinel THR-1155 shipped.
 * 
 * Brief: `Docs/plans/encounters/realm-court-brief.md`.
 * 
 * ─── The narrator's 12 questions, answered ───────────────────────────
 *   1 P1 arrival?      Yes, per class: `{actor}` comes into `{location}` on the
 *                      crown's summons (urban), or is passed through its gate
 *                      (stronghold). Agent and place are graph names.
 *   2 P2 events?       The crown claims this ground and summons from it; the court
 *                      sits until dusk; three petitioners are already gone. Costs
 *                      paid, not scenery.
 *   3 P3 one stake?    Opportunity, as the brief declared: the crown wants someone
 *                      to carry its word, whoever it picks leaves with its favour,
 *                      the rest leave.
 *   4 ≤80 words?       Opening + spine are inside budget at both classes.
 *   5 Read aloud?      Every sentence is a report. No interior sensation anywhere.
 *   6 Stated, never encoded? The hall's impatience is stated ('three petitioners
 *                      ahead of them have already been sent away'), never implied
 *                      by furniture.
 *   7 Every sentence works? Each states the challenge, the test, or the outcome.
 *   8 Nothing unintroduced? The roll, the herald, the dusk cutoff and the crown's
 *                      word all appear in prose before a card or a chip names them.
 *   9 One named person? `{cast:herald}` — the crown's crier, on stage at both beats.
 *  10 Stake in a sentence? 'Does the crown pick them to carry its word, or send
 *                      them out with the rest?'
 *  11 Cards verb+noun, spell-style? Yes; the three specials are named imperative
 *                      verb + noun and state mechanism, no odds-talk, no digits.
 *  12 Opening per class? `urban` and `stronghold`, both written, enforced by
 *                      `validateSettingEnvelope`.
 * 
 * ─── Mechanical design block (designed before the prose) ─────────────
 *   Crux            The crown is picking someone to carry its word today, and it
 *                   is nearly out of patience.
 *   Whose problem?  The agent's. They were summoned by name; the alternative to
 *                   being picked is being sent away having spent the day.
 *   Reach = theme?  Step 0 tests Gold and is *about* reading who in a crowded hall
 *                   already has the crown's ear. Step 1 tests Heart and is *about*
 *                   saying the thing to a bored court. Chosen before the scene.
 *   Shape           single_test → prize (packet roll, kept).
 *   Consequence hand (binding, THR-1145): `possession` + `movement`.
 *                   `possession` — the `rewardPool` draw on step 1's success, so
 *                   the crown's favour is a drawn object and not an authored one.
 *                   `movement` — `agent_relocation` on the same success: the crown
 *                   does not dismiss a useful subject, it sends them on. This is
 *                   the consequence that makes the summons read as service.
 *   Spine           `faction_reputation_gain` on `$realm`, both directions. It is
 *                   the family's shared spine and the ticket's third Done-when —
 *                   the court rank on the faction sheet reads this write through
 *                   `factionReputation`.
 *   Cool failure?   The crown does not jail or brand. It withdraws: the door is
 *                   still there next year, it is simply colder.
 *   Systems quota   cast + rewards + reputation + factions — four from the
 *                   authored manifest, one over the contract's floor.
 * 
 * ─── `$realm` and the chip anchor (recorded for the next author) ─────
 *   `$realm` binds `factionId` and only `factionId` (`sceneSentinels.ts`), which
 *   is what the reputation effects below use. It is **not** a chip anchor: the
 *   anchor sentinels are `$actor` / `$target` / `$artifact` / `$cast:<key>` /
 *   `$faction:<defId>`, and a Realm's definition id is minted per world
 *   (`realm.<cultureId>`), so no literal passes `classifyAnchorDeclaration`. The
 *   standing chips therefore anchor the state itself (`stateNoun` with the
 *   standing tooltip, a lawful `named` anchor) and name the crown in words. Filed
 *   as a deferral — sibling of THR-1462, which is the same gap for `$here`.
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
  id: 'encounter.realm.court_summons',
  tags: ['#crown_errand'],
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'The Crown\'s Summons',
  reach: 'gold',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['loyalty_ambition', 'asceticism_extravagance'],
  settings: ['urban', 'stronghold'],
  openings: {
    urban: '{actor} comes into {location} on the crown\'s summons. A herald carried it three towns and read '
      + 'it aloud in each one.',
    stronghold: '{actor} is passed through the gate of {location} on the crown\'s summons, and told where to '
      + 'stand and wait.',
  },
  steps: [
    {
      reach: 'gold',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.35,
      purposeLine: 'Read the court',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The crown claims this ground and summons who it likes from it. The court hears petitions until '
        + 'dusk and no longer. Three petitioners ahead of {actor} have already been sent away. The crown\'s '
        + 'crier, {cast:herald}, says the crown wants someone to carry its word out of here today. Whoever '
        + 'it picks leaves with its favour. The rest leave.',
      successAfterimage: 'They found the two people in the hall whose word the crown actually waits on.',
      failureAfterimage: 'The hall stayed a crowd of strangers wanting the same thing they wanted.',
      successAtCostAfterimage: 'They read the room true, and spent most of the afternoon doing it.',
      criticalSuccessAfterimage: 'They had the shape of the whole court before the crier called the next name.',
      criticalFailureAfterimage: 'They spent the afternoon courting the one person in the hall the crown had already dismissed.',
      deal: {
        count: 4,
        tags: ['insight', 'social'],
      },
      nudges: [
        {
          id: 'summons.weigh_the_hall',
          name: 'Weigh The Room',
          sphere: 'mind',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.memory',
          effectLine: 'Sharpen their sense of who here already has the crown\'s ear, and who only stands near it. A '
            + 'real help.',
          bandProse: {
            success: 'They worked out who mattered in the hall before they opened their mouth.',
            failure: 'They read the hall right and still could not get near the one who counted.',
          },
        },
        {
          id: 'summons.warm_the_crier',
          name: 'Turn The Crier',
          sphere: 'order',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.oath',
          effectLine: 'Incline the crown\'s caller kindly toward them, so the petition goes in through a friendly '
            + 'voice. A real help.',
          bandProse: {
            critical_success: 'The crier put their name in first and said it like it belonged there.',
            success_at_cost: 'The crier spoke for them, and made plain afterwards that it was a favour.',
            failure: 'The crier meant well and was overruled in front of the whole hall.',
          },
        },
      ],
      failureMetadata: {
        effects: [
          {
            kind: 'faction_reputation_gain',
            factionId: '$realm',
            amount: -0.03,
          },
          {
            kind: 'apply_condition',
            conditionTraitId: 'trait.condition.exhausted',
            targetAgentId: '$actor',
          },
        ],
      },
    },
    {
      reach: 'heart',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.4,
      purposeLine: 'Answer the crown',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: '{cast:herald} calls {actor} forward and puts the crown\'s question to them: what are they good '
        + 'for. Three people have answered it already today and the hall heard every word of it. The court '
        + 'is tired of the question and has not stopped asking it.',
      successAfterimage: 'The crown heard them out and said it would use them.',
      failureAfterimage: 'The crown heard them out and called the next name.',
      successAtCostAfterimage: 'The crown took them on, and made the terms plain in front of everyone.',
      criticalSuccessAfterimage: 'The court went quiet for them, which it had not done all day.',
      criticalFailureAfterimage: 'They gave the same answer the three before them had given, word for word.',
      successMetadata: {
        rewardPool: {
          categoryWeights: {
            possession: 1,
          },
        },
        effects: [
          {
            kind: 'faction_reputation_gain',
            factionId: '$realm',
            amount: 0.08,
          },
          {
            kind: 'agent_relocation',
            targetAgentId: '$actor',
            destination: {
              kind: 'away',
              minHexDistance: 3,
            },
            mode: 'travel',
          },
        ],
      },
      failureMetadata: {
        effects: [
          {
            kind: 'faction_reputation_gain',
            factionId: '$realm',
            amount: -0.06,
          },
          {
            kind: 'apply_condition',
            conditionTraitId: 'trait.condition.exhausted',
            targetAgentId: '$actor',
          },
        ],
      },
      deal: {
        count: 5,
        tags: ['presence', 'social'],
      },
      nudges: [
        {
          id: 'summons.dull_the_echo',
          name: 'Cloud The Precedent',
          sphere: 'darkness',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.dark',
          effectLine: 'Fog what the court heard from the three before them, so this answer arrives new. A real help.',
          bandProse: {
            success: 'The court listened as though nobody had stood there before them.',
            failure: 'The court forgot the other three and was no gladder to hear a fourth.',
          },
        },
      ],
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'herald',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['herald', 'noble', 'clerk'],
      supportRole: 'crown_crier',
      spawnNpcRole: 'herald',
      spawnName: 'Sef Aldwin',
    },
  ],
  narrativeTemplates: {
    initiation: 'The crown has called for them by name, and the court that called sits only until dusk. Answer '
      + 'today and the crown has a use for them. Miss the hour and the summons is spent.',
    success: 'The crown took them on and sent them out with its word to carry. The court will know the name '
      + 'next time it is read.',
    failure: 'The crown heard them and picked somebody else. The hall emptied at dusk and the road out was the '
      + 'same road in.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The court has sat and risen. What the crown thought of them is settled for this year.',
      changes: [
        {
          id: 'summons.the_court_read',
          kind: 'growth',
          title: 'A hall, read',
          detail: 'An afternoon in a crowded court teaches the gold reach.',
          polarity: 'gain',
          concepts: [
            {
              text: 'gold reach',
              tooltipId: 'reach.gold',
            },
          ],
        },
      ],
      reactions: [
        {
          id: 'summons.stay_the_night',
          label: 'Let them take the night before the road',
          effects: [
            {
              kind: 'remove_condition',
              conditionTraitId: 'trait.condition.exhausted',
            },
          ],
        },
      ],
      byOutcome: {
        success: {
          overview: 'The crown named them useful and gave them somewhere to be. They leave the hall with an errand '
            + 'and a direction.',
          changes: [
            {
              id: 'summons.counted_useful',
              kind: 'faction_reputation',
              category: 'boon',
              direction: 'gain',
              stateNoun: {
                text: 'court standing',
                tooltipId: 'ui.standing',
              },
              title: 'Counted useful',
              causeClause: 'Answered the crown in a full hall',
              detail: 'Their standing with the crown rose.',
              polarity: 'gain',
              concepts: [
                {
                  text: 'standing',
                  tooltipId: 'ui.standing',
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview: 'The crown will use them, and said so in terms the whole hall could hear. The errand is theirs '
            + 'and so is the debt of getting it.',
          changes: [
            {
              id: 'summons.counted_useful_at_cost',
              kind: 'faction_reputation',
              category: 'boon',
              direction: 'gain',
              stateNoun: {
                text: 'court standing',
                tooltipId: 'ui.standing',
              },
              title: 'Taken on, publicly',
              causeClause: 'Took the crown\'s terms in public',
              detail: 'Their standing rose, and the hall watched it.',
              polarity: 'gain',
              concepts: [
                {
                  text: 'standing',
                  tooltipId: 'ui.standing',
                },
              ],
            },
          ],
        },
        failure: {
          overview: 'The crown called the next name. The hall emptied at dusk and the day is spent.',
          changes: [
            {
              id: 'summons.passed_over',
              kind: 'faction_reputation',
              category: 'scar',
              direction: 'loss',
              stateNoun: {
                text: 'court standing',
                tooltipId: 'ui.standing',
              },
              title: 'Passed over',
              causeClause: 'Answered, and the crown picked another',
              detail: 'Their standing with the crown slipped.',
              polarity: 'loss',
              concepts: [
                {
                  text: 'standing',
                  tooltipId: 'ui.standing',
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview: 'They gave the court the answer it had already heard three times, and {cast:herald} did not call '
            + 'their name again before dusk. The crown\'s people will remember the afternoon longer than the '
            + 'answer.',
          changes: [
            {
              id: 'summons.a_wasted_hearing',
              kind: 'faction_reputation',
              category: 'scar',
              direction: 'loss',
              stateNoun: {
                text: 'court standing',
                tooltipId: 'ui.standing',
              },
              title: 'A wasted hearing',
              causeClause: 'Spent the crown\'s whole afternoon for nothing',
              detail: 'Their standing with the crown fell hard.',
              polarity: 'loss',
              concepts: [
                {
                  text: 'standing',
                  tooltipId: 'ui.standing',
                },
              ],
            },
          ],
        },
      },
    },
  },
  description: 'A two-step court summons: read a crowded hall, then answer the crown\'s question. The first '
    + 'realm-scoped encounter, binding $realm for the standing it moves.',
  locationSubtypes: expandSettings(['urban', 'stronghold']),
  consequenceDraw: ['possession', 'movement'],
};

export const COURT_SUMMONS_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
