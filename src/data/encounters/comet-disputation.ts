/**
 * The Comet Disputation (slug comet-disputation) — slot 4 of the expert-everyday-1 batch (THR-1678).
 * 
 * Brief: `Docs/plans/encounters/expert-everyday-1-brief.md`.
 * Final: `Docs/plans/encounters/comet-disputation-final.md` (draft → editorial PASS WITH
 * REVISIONS → systems READY WITH CAVEATS → package critic; see those files).
 * 
 * plotHookRolled: hook.underground_city, hook.haunt_resolution, hook.stronghold_raid
 * plotHookTaken:  hook.underground_city — drifted: the older "city under the city" with its
 *                 own politics is read as the college of star-readers, an old institution
 *                 inside the town whose public doctrine its own champion privately doubts.
 *                 Haunt resolution and stronghold raid fought the slot's pleasure register.
 * 
 * Rolled constraints (brief, binding): reach star · steps star 0.58 -> star 0.68 · settings
 * urban · shape danger-confrontation-aftermath · system forks · consequence hand secret +
 * drive · p3Shape contest · opposition faction (doctrine) · disposition neutral · agentRole
 * the target · scale settlement · rarityTier 2 · scale local · intrinsicTier shaping.
 * 
 * ─── The narrator's 12 questions, answered ───────────────────────────
 *   1 P1 arrival?      `{actor}` is in `{location}` on the fourth night of the comet.
 *   2 P2 events?       The college says plague and wants the gates shut before the fair;
 *                      it has named `{actor}` a false reader. Costs already paid.
 *   3 P3 one stake?    Contest: `{cast:champion}`, the college's first reader, wants the
 *                      council's ear; the loser's name as a star-reader will suffer.
 *   4 ≤80 words?       Opening 11 + spine 68 = 79.
 *   5 Read aloud?      Report throughout. No interior sensation.
 *   6 Stated, never encoded? The doctrine, the accusation, the dawn disputation and the
 *                      stake are all stated plainly.
 *   7 Every sentence works? Challenge, test, or outcome.
 *   8 Nothing unintroduced? The college, the council, the gates, the haze and the champion
 *                      appear in the spine before any card or chip names them; the
 *                      champion's night chart appears in step 1 before its fork prose.
 *   9 One named person? `{cast:champion}` in both beats.
 *  10 Stake in a sentence? "Can the reader the college named false win the comet
 *                      disputation before the council, against the college's champion?"
 *  11 Cards verb+noun, spell-style? Yes; two specials per step, no content word shared
 *                      between a name and its effect line, no digits, no odds-talk.
 *  12 Opening per class? `urban`, written.
 * 
 * ─── Mechanical design block (designed before the prose) ─────────────
 *   Crux            The town's college of star-readers has named the agent a false
 *                   reader over the comet, and the agent must beat the college's
 *                   champion in a public disputation before the council.
 *   Title           The Comet Disputation — a public argument about a comet.
 *   Whose problem?  The agent's: the college named them, and their name as a reader
 *                   is the stake (agentRole the target).
 *   Reach = theme?  Star both steps. Step 0 (star 0.58, steep) is about charting a moving
 *                   body's course truly through haze; step 1 (star 0.68, severe, both
 *                   fork arms) is about reading fate aloud so a town follows it.
 *   Shape           Danger – Confrontation – Aftermath, the confrontation an agent-decided
 *                   Personality Fork (THR-894) on `revelation_discretion`: the champion's
 *                   own night chart shows the comet leaving. Seeker (`positive`) holds it up
 *                   before the council — bigger standing gain, no favour. Sentinel
 *                   (`negative`, also the fallback) leaves it lying and argues from the sky
 *                   — smaller gain, and the champion owes them. The step-0 specials carry
 *                   opposite pole leans so the god has a lever on the decision.
 *   Consequence hand (binding, THR-1145): `secret` + `drive`, no swap.
 *                   `secret` — `favor_creation`, debtor `$cast:champion`, on the Sentinel
 *                   arm's success half (the chart kept out of the disputation).
 *                   `drive` — `assign_ambition` `ambition_arcane_enlightenment` on both arms'
 *                   success half (a reader who saw the college's own chart contradict its
 *                   doctrine wants the knowledge the learned keep); `plant_compulsion`
 *                   `{ explore: 0.5 }`, 96 ticks, on both arms' failure half.
 *   Standing        `reputation_with` `$here`: +0.08 Seeker success, +0.05 Sentinel success,
 *                   -0.06 step-1 failure, -0.03 step-0 failure (so the step-0
 *                   critical_failure path, which ends the action, backs its SCAR chip).
 *   Cool failure?   Nobody is hurt, jailed or branded. The gates shut on the college's
 *                   word, the reader's name suffers in the town, and they leave restless.
 *   Systems quota   cast + rewards (favor_creation, assign_ambition persist) + reputation
 *                   — three, the floor.
 *   Trait hooks     Gate: none (everyday by construction). Variant: Guiding
 *                   (`trait.personality.star.virtue`) +0.04, Proud
 *                   (`trait.core.core_humility.vice`) -0.04. Trait-only nudge: none. Trait
 *                   fragment: none.
 *   Mortal choice?  Yes — reveal the champion's chart or keep it quiet.
 *   Prose rule 7b   The ambition and the compulsion are the only forward state; the fair
 *                   is stated as the council's present ruling, never a promise.
 * 
 * ─── Measurement note ────────────────────────────────────────────────
 *   The fork step carries no top-level `difficulty`, so `measure:roll-spread` reads
 *   step 0 only (0.58, window fit 0.72 — expert). Both fork arms author star 0.68.
 * 
 * ─── Known limits (systems caveats) ──────────────────────────────────
 *   success_at_cost pays the same writes as success: aftermath bands have no auto-effect
 *   channel and step metadata is half-keyed, so that band's cost is carried in prose
 *   (plus the -0.03 step-0 debit on the failed-night route). `assignAmbitionToActor`
 *   refuses on `no_free_slot` (~21% of mature-world actors) — corpus-wide, engine-side.
 *   `ambition_arcane_enlightenment` was chosen over the systems pass's `ambition_uncover_secrets` so the
 *   batch does not land the same ambition twice (slot 6); both are AMBITION_TEMPLATES members.
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
  id: 'encounter.town.comet_disputation',
  stakes: {
    goal: 'win the comet disputation before the council',
    risk: 'be jeered from the square and the fair called off',
    won: 'won the council with the champion\'s own chart',
    lost: 'lost the council, and the fair was called off',
    lostBadly: 'was jeered for a forged chart, and the gates shut',
    arms: {
      negative: {
        won: 'won the council and kept the champion\'s chart quiet',
        lost: 'lost to the doctrine, and the fair was called off',
        lostBadly: 'was cut off by the council, and the gates shut',
      },
    },
  },
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Comet Disputation',
  reach: 'star',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['revelation_discretion', 'tradition_novelty'],
  settings: ['urban'],
  openings: {
    urban: '{actor} is in {location} on the fourth night of the comet.',
  },
  steps: [
    {
      reach: 'star',
      duration: {
        min: 1,
        max: 1,
      },
      difficulty: 0.58,
      purposeLine: 'Chart the comet\'s path',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The college of star-readers says the comet means plague and wants the gates shut before the '
        + 'fair. It has named {actor} a false reader for saying otherwise. At dawn {actor} must argue the '
        + 'comet\'s meaning before the council, against {cast:champion}, the college\'s first reader. '
        + 'Tonight, through haze, {actor} charts the comet\'s course. The council will follow the winner, '
        + 'and the loser\'s name as a star-reader will suffer.',
      criticalSuccessAfterimage: 'By midnight the chart was done: the comet runs east, away from {location}.',
      successAfterimage: 'The chart was done before morning. The comet is moving east, away from {location}.',
      successAtCostAfterimage: 'The chart was done, but {actor} had no sleep before the disputation.',
      failureAfterimage: 'Cloud came in before midnight, and the chart has a gap in it.',
      criticalFailureAfterimage: 'In the dark {actor} got the comet\'s path wrong, and found the mistake too late to fix.',
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
        tags: ['lore', 'journey'],
      },
      nudges: [
        {
          id: 'comet.part_the_clouds',
          name: 'Part The Clouds',
          sphere: 'light',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.light',
          poleLean: {
            axis: 'revelation_discretion',
            toward: 'positive',
          },
          effectLine: 'Thin the haze across the night sky, so the comet shows plain until dawn. Clear sight makes them '
            + 'readier to speak out.',
          bandProse: {
            success: 'The haze thinned, and the comet\'s tail showed plain all night.',
            near_miss: 'The haze thinned, but only for the last hour of the night.',
            failure: 'The haze thinned overhead, but the western sky stayed thick.',
          },
        },
        {
          id: 'comet.slow_the_hours',
          name: 'Slow The Hours',
          sphere: 'time',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.focus',
          poleLean: {
            axis: 'revelation_discretion',
            toward: 'negative',
          },
          effectLine: 'Stretch the night for them, so there is time to check each reading twice. Long thought makes '
            + 'them readier to hold their tongue.',
          bandProse: {
            critical_success: 'The night ran long for {actor}, and the course checked true every time.',
            success_at_cost: 'The night ran long, and {actor} spent every hour of it awake.',
            failure: 'The night ran long, and {actor} spent it checking the same wrong line.',
            critical_failure: 'The long night made {actor} doubt a sound chart, and they changed it.',
          },
        },
      ],
    },
    {
      branchOnStep: 0,
      decidedBy: {
        axis: 'revelation_discretion',
      },
      variants: {
        positive: {
          reach: 'star',
          duration: {
            min: 1,
            max: 2,
          },
          difficulty: 0.68,
          purposeLine: 'Win the disputation',
          onSuccess: [],
          onFailure: [],
          failBehavior: 'fail_action',
          narrativeTemplate: 'At dawn the council sits in the market square, and half of {location} comes to watch. '
            + '{cast:champion} reads the college\'s doctrine: every comet brings plague. But the champion\'s '
            + 'own night chart lies open on the table, and it shows the comet leaving. {actor} holds the chart '
            + 'up for the council to see.',
          criticalSuccessAfterimage: 'The council saw the college\'s own chart show the comet leaving, and voted before the college '
            + 'could object.',
          successAfterimage: 'The council read the champion\'s chart and took {actor}\'s side.',
          successAtCostAfterimage: 'The council believed the chart, after an hour of the college\'s objections.',
          failureAfterimage: '{cast:champion} called the chart an apprentice\'s exercise, and the council believed it.',
          criticalFailureAfterimage: 'The council called the chart a forgery, and the square jeered {actor} for bringing it.',
          successMetadata: {
            effects: [
              {
                kind: 'reputation_with',
                targetLocationId: '$here',
                delta: 0.08,
              },
              {
                kind: 'assign_ambition',
                templateId: 'ambition_arcane_enlightenment',
                targetAgentId: '$actor',
                narrativeHook: 'Saw the college\'s own chart contradict its doctrine, and wants the knowledge the learned keep '
                  + 'to themselves.',
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
                kind: 'plant_compulsion',
                targetAgentId: '$actor',
                encounterBias: {
                  explore: 0.5,
                },
                durationTicks: 96,
                narrativeHook: 'Lost the argument over the comet, and is restless to go and look for themselves.',
              },
            ],
          },
          deal: {
            count: 4,
            tags: ['social', 'presence'],
          },
          nudges: [
            {
              id: 'comet.hush_the_crowd',
              name: 'Hush The Crowd',
              sphere: 'order',
              essenceCost: 2,
              forecastDelta: 0.12,
              imageTag: 'generic.crowd',
              effectLine: 'Silence the onlookers\' chatter, so the council hears every word of the argument.',
              bandProse: {
                success: 'The square went quiet, and the council heard every word {actor} said about the chart.',
                near_miss: 'The square went quiet, then a heckler shouted over the end of it.',
                failure: 'The square went quiet for {actor}, and the council heard the doctrine just as clearly.',
              },
            },
            {
              id: 'comet.unsettle_the_champion',
              name: 'Unsettle The Champion',
              sphere: 'chaos',
              essenceCost: 1,
              forecastDelta: 0.09,
              imageTag: 'generic.rumor',
              effectLine: 'Put a catch in the rival\'s voice, so the council hears doubt in the doctrine.',
              bandProse: {
                critical_success: '{cast:champion} lost the thread of the doctrine halfway, and the council saw it.',
                success_at_cost: '{cast:champion} stumbled once, then recovered and answered {actor} sharply.',
                failure: '{cast:champion} stumbled, and the council put it down to nerves.',
                critical_failure: '{cast:champion} stumbled, and the square cheered the champion on through it.',
              },
            },
          ],
        },
        negative: {
          reach: 'star',
          duration: {
            min: 1,
            max: 2,
          },
          difficulty: 0.68,
          purposeLine: 'Win the disputation',
          onSuccess: [],
          onFailure: [],
          failBehavior: 'fail_action',
          narrativeTemplate: 'At dawn the council sits in the market square, and half of {location} comes to watch. '
            + '{cast:champion} reads the college\'s doctrine: every comet brings plague. But the champion\'s '
            + 'own night chart lies open on the table, and it shows the comet leaving. {actor} leaves the chart '
            + 'where it lies and argues from their own reading of the sky.',
          criticalSuccessAfterimage: 'The council followed {actor}\'s course across the sky and voted before the champion could '
            + 'answer.',
          successAfterimage: 'The council followed {actor}\'s reading of the course.',
          successAtCostAfterimage: 'The council followed {actor}\'s reading after an hour of the college\'s objections.',
          failureAfterimage: 'The council found the doctrine easier to believe than the course.',
          criticalFailureAfterimage: 'The council asked {actor} to stop before the argument was done.',
          successMetadata: {
            effects: [
              {
                kind: 'reputation_with',
                targetLocationId: '$here',
                delta: 0.05,
              },
              {
                kind: 'favor_creation',
                magnitudeRange: [0.15, 0.3],
                context: 'Kept the champion\'s own chart out of the disputation',
                debtorAgentId: '$cast:champion',
              },
              {
                kind: 'assign_ambition',
                templateId: 'ambition_arcane_enlightenment',
                targetAgentId: '$actor',
                narrativeHook: 'Saw the college\'s own chart contradict its doctrine, and wants the knowledge the learned keep '
                  + 'to themselves.',
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
                kind: 'plant_compulsion',
                targetAgentId: '$actor',
                encounterBias: {
                  explore: 0.5,
                },
                durationTicks: 96,
                narrativeHook: 'Lost the argument over the comet, and is restless to go and look for themselves.',
              },
            ],
          },
          deal: {
            count: 4,
            tags: ['social', 'presence'],
          },
          nudges: [
            {
              id: 'comet.steady_the_voice',
              name: 'Steady The Voice',
              sphere: 'mind',
              essenceCost: 2,
              forecastDelta: 0.12,
              imageTag: 'generic.focus',
              effectLine: 'Keep their argument calm and exact, so the council can follow each step of it.',
              bandProse: {
                success: '{actor} walked the council through the course line by line, and was heard to the end.',
                near_miss: '{actor} kept calm, but lost the council for a moment at the hardest part.',
                failure: '{actor} stayed calm and exact to the end, but the council stopped listening halfway.',
              },
            },
            {
              id: 'comet.brighten_the_tail',
              name: 'Brighten The Tail',
              sphere: 'light',
              essenceCost: 2,
              forecastDelta: 0.1,
              imageTag: 'generic.light',
              effectLine: 'Make the comet flare at dawn, so the whole square can see which way it points.',
              bandProse: {
                critical_success: 'The comet flared east as the sun came up, and the square went quiet.',
                success_at_cost: 'The comet flared, and the college called the flare a warning.',
                failure: 'The comet flared, and {cast:champion} read the flare as plague coming.',
                critical_failure: 'The comet flared, and half the square ran home to bar their doors.',
              },
            },
          ],
        },
      },
      fallback: {
        reach: 'star',
        duration: {
          min: 1,
          max: 2,
        },
        difficulty: 0.68,
        purposeLine: 'Win the disputation',
        onSuccess: [],
        onFailure: [],
        failBehavior: 'fail_action',
        narrativeTemplate: 'At dawn the council sits in the market square, and half of {location} comes to watch. '
          + '{cast:champion} reads the college\'s doctrine: every comet brings plague. But the champion\'s '
          + 'own night chart lies open on the table, and it shows the comet leaving. {actor} leaves the chart '
          + 'where it lies and argues from their own reading of the sky.',
        criticalSuccessAfterimage: 'The council followed {actor}\'s course across the sky and voted before the champion could '
          + 'answer.',
        successAfterimage: 'The council followed {actor}\'s reading of the course.',
        successAtCostAfterimage: 'The council followed {actor}\'s reading after an hour of the college\'s objections.',
        failureAfterimage: 'The council found the doctrine easier to believe than the course.',
        criticalFailureAfterimage: 'The council asked {actor} to stop before the argument was done.',
        successMetadata: {
          effects: [
            {
              kind: 'reputation_with',
              targetLocationId: '$here',
              delta: 0.05,
            },
            {
              kind: 'favor_creation',
              magnitudeRange: [0.15, 0.3],
              context: 'Kept the champion\'s own chart out of the disputation',
              debtorAgentId: '$cast:champion',
            },
            {
              kind: 'assign_ambition',
              templateId: 'ambition_arcane_enlightenment',
              targetAgentId: '$actor',
              narrativeHook: 'Saw the college\'s own chart contradict its doctrine, and wants the knowledge the learned keep '
                + 'to themselves.',
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
              kind: 'plant_compulsion',
              targetAgentId: '$actor',
              encounterBias: {
                explore: 0.5,
              },
              durationTicks: 96,
              narrativeHook: 'Lost the argument over the comet, and is restless to go and look for themselves.',
            },
          ],
        },
        deal: {
          count: 4,
          tags: ['social', 'presence'],
        },
        nudges: [
          {
            id: 'comet.steady_the_voice',
            name: 'Steady The Voice',
            sphere: 'mind',
            essenceCost: 2,
            forecastDelta: 0.12,
            imageTag: 'generic.focus',
            effectLine: 'Keep their argument calm and exact, so the council can follow each step of it.',
            bandProse: {
              success: '{actor} walked the council through the course line by line, and was heard to the end.',
              near_miss: '{actor} kept calm, but lost the council for a moment at the hardest part.',
              failure: '{actor} stayed calm and exact to the end, but the council stopped listening halfway.',
            },
          },
          {
            id: 'comet.brighten_the_tail',
            name: 'Brighten The Tail',
            sphere: 'light',
            essenceCost: 2,
            forecastDelta: 0.1,
            imageTag: 'generic.light',
            effectLine: 'Make the comet flare at dawn, so the whole square can see which way it points.',
            bandProse: {
              critical_success: 'The comet flared east as the sun came up, and the square went quiet.',
              success_at_cost: 'The comet flared, and the college called the flare a warning.',
              failure: 'The comet flared, and {cast:champion} read the flare as plague coming.',
              critical_failure: 'The comet flared, and half the square ran home to bar their doors.',
            },
          },
        ],
      },
    },
  ],
  traitVariants: [
    {
      traitId: 'trait.personality.star.virtue',
      forecastDelta: 0.04,
      factorLine: 'Being Guiding, they read the sky aloud and a crowd follows.',
    },
    {
      traitId: 'trait.core.core_humility.vice',
      forecastDelta: -0.04,
      factorLine: 'Being Proud, they bristle at being named a false reader.',
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'champion',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['sage', 'scholar', 'oracle'],
      supportRole: 'college_champion',
      spawnNpcRole: 'sage',
      spawnName: 'Maudry Fenn',
    },
  ],
  narrativeTemplates: {
    initiation: 'A town\'s college of star-readers has named a reader false over a comet, and the two will argue '
      + 'it before the council at dawn.',
    success: 'The council took the reader\'s side against the college over the comet.',
    failure: 'The council took the college\'s side over the comet, and the reader\'s name suffered for it.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      positive: {
        overview: 'The council has ruled on the gates before the whole square.',
        changes: [],
        byOutcome: {
          critical_success: {
            overview: 'The gates stay open for the fair. By noon the college\'s doctrine was the joke of the market.',
            changes: [
              {
                id: 'comet.seek.crit.standing',
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
                title: 'Believed by the council',
                detail: '{location} thinks better of {actor}\'s star-reading.',
                concepts: [
                  {
                    text: 'thinks better of',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
              {
                id: 'comet.seek.crit.ambition',
                kind: 'future_hook',
                category: 'path',
                direction: 'opens',
                polarity: 'info',
                stateNoun: {
                  text: 'ambition',
                  tooltipId: 'ui.ambition',
                },
                title: 'A new ambition',
                detail: '{actor} is pursuing Achieve Arcane Enlightenment now.',
                concepts: [
                  {
                    text: 'Achieve Arcane Enlightenment',
                    tooltipId: 'ui.ambition',
                  },
                ],
              },
            ],
          },
          success: {
            overview: 'The gates stay open. The college lost in public, on its own chart.',
            changes: [
              {
                id: 'comet.seek.success.standing',
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
                title: 'Believed by the council',
                detail: '{location} thinks better of {actor}\'s star-reading.',
                concepts: [
                  {
                    text: 'thinks better of',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
              {
                id: 'comet.seek.success.ambition',
                kind: 'future_hook',
                category: 'path',
                direction: 'opens',
                polarity: 'info',
                stateNoun: {
                  text: 'ambition',
                  tooltipId: 'ui.ambition',
                },
                title: 'A new ambition',
                detail: '{actor} is pursuing Achieve Arcane Enlightenment now.',
                concepts: [
                  {
                    text: 'Achieve Arcane Enlightenment',
                    tooltipId: 'ui.ambition',
                  },
                ],
              },
            ],
          },
          success_at_cost: {
            overview: 'The gates stay open for the fair. {cast:champion} left the square without a word to {actor}.',
            changes: [
              {
                id: 'comet.seek.cost.standing',
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
                title: 'Believed in the end',
                detail: '{location} thinks better of {actor}\'s star-reading.',
                concepts: [
                  {
                    text: 'thinks better of',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
              {
                id: 'comet.seek.cost.ambition',
                kind: 'future_hook',
                category: 'path',
                direction: 'opens',
                polarity: 'info',
                stateNoun: {
                  text: 'ambition',
                  tooltipId: 'ui.ambition',
                },
                title: 'A new ambition',
                detail: '{actor} is pursuing Achieve Arcane Enlightenment now.',
                concepts: [
                  {
                    text: 'Achieve Arcane Enlightenment',
                    tooltipId: 'ui.ambition',
                  },
                ],
              },
            ],
          },
          failure: {
            overview: 'The gates are shut on the college\'s word, and the spring fair is called off.',
            changes: [
              {
                id: 'comet.seek.fail.standing',
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
                title: 'Named a false reader',
                detail: '{location} trusts {actor}\'s star-reading less.',
                concepts: [
                  {
                    text: 'trusts',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
              {
                id: 'comet.seek.fail.restless',
                kind: 'shell_state',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                stateNoun: {
                  text: 'compulsion',
                  tooltipId: 'ui.compulsion',
                },
                title: 'Restless',
                detail: '{actor} is restless to explore for a while.',
                concepts: [
                  {
                    text: 'restless to explore',
                    tooltipId: 'ui.compulsion',
                  },
                ],
              },
            ],
          },
          critical_failure: {
            overview: 'The gates are shut, the spring fair is called off, and the council thanked the college before '
              + 'the whole square.',
            changes: [
              {
                id: 'comet.seek.critfail.standing',
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
                title: 'Named a false reader',
                detail: '{location} trusts {actor}\'s star-reading less.',
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
      negative: {
        overview: 'The council has ruled on the gates before the whole square.',
        changes: [],
        byOutcome: {
          critical_success: {
            overview: 'The gates stay open for the fair. {cast:champion} found {actor} after the vote and thanked them '
              + 'for leaving the chart on the table.',
            changes: [
              {
                id: 'comet.keep.crit.standing',
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
                title: 'Believed by the council',
                detail: '{location} thinks better of {actor}\'s star-reading.',
                concepts: [
                  {
                    text: 'thinks better of',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
              {
                id: 'comet.keep.crit.favour',
                kind: 'shell_state',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                stateNoun: {
                  text: 'a favour owed',
                  tooltipId: 'ui.favour_owed',
                },
                title: 'A favour owed',
                detail: '{cast:champion} owes {actor} a favour.',
                concepts: [
                  {
                    text: '{cast:champion}',
                    entityId: '$cast:champion',
                    visualKind: 'agent',
                  },
                ],
              },
              {
                id: 'comet.keep.crit.ambition',
                kind: 'future_hook',
                category: 'path',
                direction: 'opens',
                polarity: 'info',
                stateNoun: {
                  text: 'ambition',
                  tooltipId: 'ui.ambition',
                },
                title: 'A new ambition',
                detail: '{actor} is pursuing Achieve Arcane Enlightenment now.',
                concepts: [
                  {
                    text: 'Achieve Arcane Enlightenment',
                    tooltipId: 'ui.ambition',
                  },
                ],
              },
            ],
          },
          success: {
            overview: 'The gates stay open. The college\'s chart was never mentioned, and {cast:champion} knows {actor} '
              + 'kept it quiet.',
            changes: [
              {
                id: 'comet.keep.success.standing',
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
                title: 'Believed by the council',
                detail: '{location} thinks better of {actor}\'s star-reading.',
                concepts: [
                  {
                    text: 'thinks better of',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
              {
                id: 'comet.keep.success.favour',
                kind: 'shell_state',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                stateNoun: {
                  text: 'a favour owed',
                  tooltipId: 'ui.favour_owed',
                },
                title: 'A favour owed',
                detail: '{cast:champion} owes {actor} a favour.',
                concepts: [
                  {
                    text: '{cast:champion}',
                    entityId: '$cast:champion',
                    visualKind: 'agent',
                  },
                ],
              },
              {
                id: 'comet.keep.success.ambition',
                kind: 'future_hook',
                category: 'path',
                direction: 'opens',
                polarity: 'info',
                stateNoun: {
                  text: 'ambition',
                  tooltipId: 'ui.ambition',
                },
                title: 'A new ambition',
                detail: '{actor} is pursuing Achieve Arcane Enlightenment now.',
                concepts: [
                  {
                    text: 'Achieve Arcane Enlightenment',
                    tooltipId: 'ui.ambition',
                  },
                ],
              },
            ],
          },
          success_at_cost: {
            overview: 'The gates stay open for the fair. {cast:champion} left the square knowing {actor} had held back.',
            changes: [
              {
                id: 'comet.keep.cost.standing',
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
                title: 'Believed in the end',
                detail: '{location} thinks better of {actor}\'s star-reading.',
                concepts: [
                  {
                    text: 'thinks better of',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
              {
                id: 'comet.keep.cost.favour',
                kind: 'shell_state',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                stateNoun: {
                  text: 'a favour owed',
                  tooltipId: 'ui.favour_owed',
                },
                title: 'A favour owed',
                detail: '{cast:champion} owes {actor} a favour.',
                concepts: [
                  {
                    text: '{cast:champion}',
                    entityId: '$cast:champion',
                    visualKind: 'agent',
                  },
                ],
              },
              {
                id: 'comet.keep.cost.ambition',
                kind: 'future_hook',
                category: 'path',
                direction: 'opens',
                polarity: 'info',
                stateNoun: {
                  text: 'ambition',
                  tooltipId: 'ui.ambition',
                },
                title: 'A new ambition',
                detail: '{actor} is pursuing Achieve Arcane Enlightenment now.',
                concepts: [
                  {
                    text: 'Achieve Arcane Enlightenment',
                    tooltipId: 'ui.ambition',
                  },
                ],
              },
            ],
          },
          failure: {
            overview: 'The gates are shut on the college\'s word, and the spring fair is called off. {cast:champion} '
              + 'took the win and never mentioned the chart.',
            changes: [
              {
                id: 'comet.keep.fail.standing',
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
                title: 'Named a false reader',
                detail: '{location} trusts {actor}\'s star-reading less.',
                concepts: [
                  {
                    text: 'trusts',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
              {
                id: 'comet.keep.fail.restless',
                kind: 'shell_state',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                stateNoun: {
                  text: 'compulsion',
                  tooltipId: 'ui.compulsion',
                },
                title: 'Restless',
                detail: '{actor} is restless to explore for a while.',
                concepts: [
                  {
                    text: 'restless to explore',
                    tooltipId: 'ui.compulsion',
                  },
                ],
              },
            ],
          },
          critical_failure: {
            overview: 'The gates are shut, and the council thanked the college before the whole square. '
              + '{cast:champion}\'s own chart showed the comet leaving, and it went back to the college unread.',
            changes: [
              {
                id: 'comet.keep.critfail.standing',
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
                title: 'Named a false reader',
                detail: '{location} trusts {actor}\'s star-reading less.',
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
      overview: 'The council has ruled on the gates before the whole square.',
      changes: [],
      byOutcome: {
        critical_success: {
          overview: 'The gates stay open for the fair. {cast:champion} found {actor} after the vote and thanked them '
            + 'for leaving the chart on the table.',
          changes: [
            {
              id: 'comet.fallback.crit.standing',
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
              title: 'Believed by the council',
              detail: '{location} thinks better of {actor}\'s star-reading.',
              concepts: [
                {
                  text: 'thinks better of',
                  tooltipId: 'ui.standing',
                },
              ],
            },
            {
              id: 'comet.fallback.crit.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              title: 'A favour owed',
              detail: '{cast:champion} owes {actor} a favour.',
              concepts: [
                {
                  text: '{cast:champion}',
                  entityId: '$cast:champion',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'comet.fallback.crit.ambition',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
              stateNoun: {
                text: 'ambition',
                tooltipId: 'ui.ambition',
              },
              title: 'A new ambition',
              detail: '{actor} is pursuing Achieve Arcane Enlightenment now.',
              concepts: [
                {
                  text: 'Achieve Arcane Enlightenment',
                  tooltipId: 'ui.ambition',
                },
              ],
            },
          ],
        },
        success: {
          overview: 'The gates stay open. The college\'s chart was never mentioned, and {cast:champion} knows {actor} '
            + 'kept it quiet.',
          changes: [
            {
              id: 'comet.fallback.success.standing',
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
              title: 'Believed by the council',
              detail: '{location} thinks better of {actor}\'s star-reading.',
              concepts: [
                {
                  text: 'thinks better of',
                  tooltipId: 'ui.standing',
                },
              ],
            },
            {
              id: 'comet.fallback.success.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              title: 'A favour owed',
              detail: '{cast:champion} owes {actor} a favour.',
              concepts: [
                {
                  text: '{cast:champion}',
                  entityId: '$cast:champion',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'comet.fallback.success.ambition',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
              stateNoun: {
                text: 'ambition',
                tooltipId: 'ui.ambition',
              },
              title: 'A new ambition',
              detail: '{actor} is pursuing Achieve Arcane Enlightenment now.',
              concepts: [
                {
                  text: 'Achieve Arcane Enlightenment',
                  tooltipId: 'ui.ambition',
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview: 'The gates stay open for the fair. {cast:champion} left the square knowing {actor} had held back.',
          changes: [
            {
              id: 'comet.fallback.cost.standing',
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
              title: 'Believed in the end',
              detail: '{location} thinks better of {actor}\'s star-reading.',
              concepts: [
                {
                  text: 'thinks better of',
                  tooltipId: 'ui.standing',
                },
              ],
            },
            {
              id: 'comet.fallback.cost.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              title: 'A favour owed',
              detail: '{cast:champion} owes {actor} a favour.',
              concepts: [
                {
                  text: '{cast:champion}',
                  entityId: '$cast:champion',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'comet.fallback.cost.ambition',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
              stateNoun: {
                text: 'ambition',
                tooltipId: 'ui.ambition',
              },
              title: 'A new ambition',
              detail: '{actor} is pursuing Achieve Arcane Enlightenment now.',
              concepts: [
                {
                  text: 'Achieve Arcane Enlightenment',
                  tooltipId: 'ui.ambition',
                },
              ],
            },
          ],
        },
        failure: {
          overview: 'The gates are shut on the college\'s word, and the spring fair is called off. {cast:champion} '
            + 'took the win and never mentioned the chart.',
          changes: [
            {
              id: 'comet.fallback.fail.standing',
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
              title: 'Named a false reader',
              detail: '{location} trusts {actor}\'s star-reading less.',
              concepts: [
                {
                  text: 'trusts',
                  tooltipId: 'ui.standing',
                },
              ],
            },
            {
              id: 'comet.fallback.fail.restless',
              kind: 'shell_state',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'compulsion',
                tooltipId: 'ui.compulsion',
              },
              title: 'Restless',
              detail: '{actor} is restless to explore for a while.',
              concepts: [
                {
                  text: 'restless to explore',
                  tooltipId: 'ui.compulsion',
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview: 'The gates are shut, and the council thanked the college before the whole square. '
            + '{cast:champion}\'s own chart showed the comet leaving, and it went back to the college unread.',
          changes: [
            {
              id: 'comet.fallback.critfail.standing',
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
              title: 'Named a false reader',
              detail: '{location} trusts {actor}\'s star-reading less.',
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
  description:
    'A comet is crossing a hazy sky, and the town council wants its meaning argued before them '
    + 'against the champion of the town\'s college of star-readers. The champion\'s own chart agrees '
    + 'with the challenger\'s, and whether to say so in public is a choice.',
  locationSubtypes: expandSettings(['urban']),
  consequenceDraw: ['secret', 'drive'],
};

export const COMET_DISPUTATION_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
