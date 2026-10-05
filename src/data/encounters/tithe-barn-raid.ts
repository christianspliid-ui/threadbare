/**
 * Blamed for the Tithe Barn — slot 3 of the expert-everyday-1 batch (THR-1678).
 * 
 * Brief: `Docs/plans/encounters/expert-everyday-1-brief.md`.
 * Pipeline: tithe-barn-raid-draft / -editorial / -revised / -systems / -final / -package.md.
 * 
 * plotHookRolled: hook.market_collapse, hook.lost_civilization, hook.home_becomes_dangerous
 * plotHookTaken:  hook.market_collapse — grain fetched nothing at market, so the lord took
 *                 his tithe in kind and half the village is short of bread. Blended with
 *                 hook.lost_civilization: the thief's way in is a carved passage older than
 *                 the village. hook.home_becomes_dangerous set aside.
 * 
 * Rolled constraints (brief, binding): reach shadow · steps shadow 0.60 -> shadow 0.66 ·
 * settings rural · shape danger – confrontation – aftermath · system forks ·
 * consequence hand thread + omen · p3Shape obstruction · opposition own_trait (read
 * from the graph) · disposition wary · agentRole suspect_or_cause · scale personal ·
 * rarityTier 2 · scale local · intrinsicTier shaping (brief: the 0.45 open-draw cap
 * binds background only).
 * 
 * ─── The narrator's 12 questions, answered ───────────────────────────
 *   1 P1 arrival?      Yes: `{actor}` arrives in `{location}` on tithe day.
 *   2 P2 events?       Grain fetched nothing at market; the lord took the tithe in kind;
 *                      two nights ago a cartload left the barn with no lock broken.
 *   3 P3 one stake?    Obstruction: the reeve has shut the road out until the grain is
 *                      found. The cost is stated plainly: if it is not found, the village
 *                      calls {actor} the thief.
 *   4 ≤80 words?       Opening (7) + step-0 spine (67) = 74.
 *   5 Read aloud?      Every sentence is a report. No interior sensation.
 *   6 Stated, never encoded? The shut road, the suspicion and the stake are stated.
 *   7 Every sentence works? Each states the challenge, the test or the outcome.
 *   8 Nothing unintroduced? Reeve, barn, watch and grain in the spine; the passage and
 *                      the elder in step 1 prose, after the search has found them.
 *   9 One named person? Beat 1 `{cast:reeve}`; beat 2 `{cast:elder}` (the reeve is
 *                      "the reeve" there).
 *  10 Stake in a sentence? 'Can {actor} clear their name of the tithe theft before the
 *                      village calls them the thief?'
 *  11 Cards verb+noun, spell-style? Yes; four specials, no card-name word repeated in its
 *                      effect line, no digits.
 *  12 Opening per class? `rural`, the only declared class.
 * 
 * ─── Mechanical design block (designed before the prose) ─────────────
 *   Crux            The lord's reeve blames the agent for a theft from the tithe barn
 *                   that only an expert sneak could manage, and shuts the road until the
 *                   grain is found.
 *   Whose problem?  The agent's: they are the suspect (agentRole suspect_or_cause).
 *   Reach = theme?  Shadow both steps. Step 0 (0.60) is *about* getting into a watched
 *                   barn unseen. Step 1 (0.66, both arms) is *about* moving unseen under
 *                   a watch. Mean 0.63, window fit 0.77 (expert).
 *   Shape           Danger – Confrontation – Aftermath. Step 0 is the danger announced
 *                   (the reeve's men watch the barn); every band finds the loose floor
 *                   stone, and the bands differ in whether the watch saw. Step 1 is the
 *                   confrontation: an agent-decided fork on `honesty_cunning`, Shadow's
 *                   own pair. Confessor (`positive`) names the elder to the reeve and
 *                   must catch the grain moving. Puppeteer (`negative`) names nobody and
 *                   carries the grain back through the passage before the dawn count.
 *                   Fallback = the Confessor arm (full copy, effects included). The two
 *                   step-0 specials lean opposite poles.
 *   Opposition      The mortal's own trait, read from the graph: Infamous
 *                   (`trait.reputation.shadow.negative`, −0.05) or Enigmatic
 *                   (`trait.reputation.shadow.positive`, +0.04). The reeve's suspicion
 *                   is the fiction of the same fact.
 *   Disposition     Wary: the reeve watches and does not arrest.
 *   Consequence hand (binding, THR-1145): `thread` + `omen`, no swap.
 *                   `thread` — `thread_strengthen` ($ascendant ↔ $actor) on the success
 *                   side of both arms, `thread_weaken` on the failure side of both arms.
 *                   `omen` — `emit_omen` (cultural, global, 0.3) wherever the carved
 *                   passage becomes public: both sides of the Confessor arm (time on
 *                   success, darkness on failure) and the Puppeteer failure (darkness).
 *                   The Puppeteer success keeps the passage secret, so a `hidden_mark`
 *                   (secret_knowledge, revealFamilies shadow + settlement) records it
 *                   instead. The omen backs no chip (`CHIP_BACKING_EFFECT_KINDS`); the
 *                   overviews carry it in words.
 *   Extra           `reputation_with $here` (+0.05 Confessor success; −0.08 on both
 *                   failures). `bond_change $cast:reeve` (up on Confessor success, down
 *                   on both failures). `bond_change $cast:elder` (down on Confessor
 *                   success, up on Puppeteer success).
 *   Chips (THR-1685) The reeve's chip noun is plain `reputation` with a tooltip, no
 *                   `{target}` (ledger-by-lamplight precedent). The only
 *                   `reputation with {target}` chip is anchored on `$here`, where the
 *                   village is what the prose means.
 *   Cool failure?   Nobody is jailed, hurt or branded. The village takes the agent for
 *                   the thief and the reeve trusts them less: reputation before money.
 *   Trait hooks     Gate: none (everyday by construction). Variant: the two shadow
 *                   reputation traits. Trait-only nudge: none. Trait fragment: none.
 *   Systems quota   cast + rewards (thread, bond, hidden mark persist) + reputation —
 *                   three, the floor.
 *   Specials        Step 0: Dull The Sentries (Stumble, mind, lean negative) and Show The
 *                   Plain Truth (Whisper, light, lean positive). Confessor: Stretch The
 *                   Small Hours (Boost, time). Puppeteer: Ease The Burden (Boost, matter).
 *                   No rider, no Heavy Hand, no over-exposed library card as a special.
 *   Prose rule 7b   The shut road is a scene fact resolved inside the encounter; "one
 *                   sack is still owed" is the reeve's statement. No later place or time
 *                   is promised.
 *   Ids             Nudge and chip ids use the `barn.` prefix (`tithe.` is taken by
 *                   tithe-demanded.ts).
 * 
 * ─── Measurement note ────────────────────────────────────────────────
 *   The fork step carries no top-level `difficulty`, so `measure:roll-spread` reads
 *   step 0 only (0.60, window fit 0.74, expert). Both arms author 0.66, rolled by every
 *   mortal who reaches step 1.
 * 
 * ─── Critic loop (one loop, 2026-09-30) ──────────────────────────────
 *   Editorial PASS WITH REVISIONS (seam echoes, page repetition, road/passage
 *   naming, village chip noun → `reputation with {target}` on `$here`). Systems READY
 *   FOR IMPLEMENTATION (reeve chip `stateNoun` given its tooltip anchor). Package PASS,
 *   connected. At implementation the two step-0 card names moved onto
 *   IMPERATIVE_VERB_LEXICON verbs (Dull The Sentries, Show The Plain Truth) and the
 *   Confessor omen hooks were aligned to "passage".
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
  id: 'encounter.town.tithe_barn_raid',
  stakes: {
    goal: 'clear their name of the tithe-barn theft',
    risk: 'be called the tithe thief by the whole village',
    won: 'caught the elder moving the tithe grain',
    lost: 'was found alone in the passage and called the thief',
    lostBadly: 'was found beside the grain and called the thief',
    arms: {
      negative: {
        won: 'carried the grain back before the dawn count',
        lost: 'was caught with a sack and called the tithe thief',
        lostBadly: 'met the reeve in the barn with the first sack',
      },
    },
  },
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'Blamed for the Tithe Barn',
  reach: 'shadow',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['honesty_cunning'],
  settings: ['rural'],
  openings: {
    rural: '{actor} arrives in {location} on tithe day.',
  },
  steps: [
    {
      reach: 'shadow',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.6,
      purposeLine: 'Find the way in',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'Grain fetched nothing at market, so the lord took his tithe in kind. Two nights ago a cartload '
        + 'left the tithe barn with no lock broken. {cast:reeve} says only one person here could do that, '
        + 'and names {actor}. The reeve has shut the road out until the grain is found. If it is not found, '
        + '{location} will call {actor} the thief. Tonight {actor} searches the barn under the reeve\'s '
        + 'watch.',
      successAfterimage: 'They found a floor stone that lifts, and steps going down beneath it.',
      failureAfterimage: 'They found the loose stone, and the reeve\'s men saw them climb out of the floor.',
      successAtCostAfterimage: 'They found the loose stone, and a watchman heard it drop back into place.',
      criticalSuccessAfterimage: 'They lifted a loose floor stone and went down the steps below it, and the watch saw no light.',
      criticalFailureAfterimage: 'The reeve\'s men saw them go down through the floor, and now the whole watch is waiting.',
      deal: {
        count: 4,
        tags: ['shadow', 'peril'],
      },
      nudges: [
        {
          id: 'barn.dull_the_sentries',
          name: 'Dull The Sentries',
          sphere: 'mind',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.focus',
          poleLean: {
            axis: 'honesty_cunning',
            toward: 'negative',
          },
          effectLine: 'Send a heavy sleep over the watch, so fewer eyes are open. It favours the quiet course.',
          bandProse: {
            critical_success: 'The men at the barn door slept sitting up until first light.',
            success: 'The watchmen nodded over their lantern, and neither looked toward the barn.',
            near_miss: 'The watchmen dozed, but one woke and walked the barn with a lantern.',
            failure: 'The watchmen dozed off, and a dog in the yard did the watching instead.',
          },
        },
        {
          id: 'barn.show_the_plain_truth',
          name: 'Show The Plain Truth',
          sphere: 'light',
          essenceCost: 2,
          forecastDelta: 0.07,
          imageTag: 'generic.light',
          poleLean: {
            axis: 'honesty_cunning',
            toward: 'positive',
          },
          effectLine: 'Make the honest course look short and safe, so they act without second thoughts. It leans them '
            + 'toward naming names.',
          bandProse: {
            success_at_cost: 'The truthful course looked so plain that they stopped to weigh it, and were heard.',
            failure: 'They stood in the dark thinking about what to tell the reeve, and missed the watch changing.',
            critical_failure: 'They were still deciding what to tell the reeve when the reeve\'s men came through the door.',
          },
        },
      ],
    },
    {
      branchOnStep: 0,
      decidedBy: {
        axis: 'honesty_cunning',
      },
      variants: {
        positive: {
          reach: 'shadow',
          duration: {
            min: 1,
            max: 2,
          },
          difficulty: 0.66,
          purposeLine: 'Catch the grain moving',
          onSuccess: [],
          onFailure: [],
          failBehavior: 'fail_action',
          narrativeTemplate: 'Under the stone, a passage of carved blocks older than the village runs to the cellar of '
            + '{cast:elder}\'s house. The missing grain is in that cellar. Half the houses are short of bread, '
            + 'and {cast:elder} took the grain to feed them. {actor} names the elder to the reeve. The reeve '
            + 'will not take a suspect\'s word. The grain goes out to the houses tonight, and {actor} must '
            + 'catch it moving.',
          successAfterimage: 'The reeve came down the steps and found the elder with a sack on each shoulder.',
          failureAfterimage: 'The elder never came, and the reeve found them alone in the passage.',
          successAtCostAfterimage: 'They caught the elder, but half the sacks were already shared out.',
          criticalSuccessAfterimage: 'They waited in the dark passage until the elder came, and fetched the reeve without a sound.',
          criticalFailureAfterimage: 'The elder heard them in the dark, and the reeve found them alone beside the grain.',
          successMetadata: {
            effects: [
              {
                kind: 'bond_change',
                withAgentId: '$cast:reeve',
                sentimentDelta: 0.12,
                trustDelta: 0.1,
              },
              {
                kind: 'bond_change',
                withAgentId: '$cast:elder',
                sentimentDelta: -0.15,
              },
              {
                kind: 'reputation_with',
                targetLocationId: '$here',
                delta: 0.05,
              },
              {
                kind: 'thread_strengthen',
                ascendantId: '$ascendant',
                mortalId: '$actor',
                reason: 'The god kept close in the dark',
              },
              {
                kind: 'emit_omen',
                category: 'cultural',
                intensity: 0.3,
                narrativeHook: 'A carved passage older than any village was found under a lord\'s tithe barn, and the country '
                  + 'round says the old passages are opening again.',
                scope: {
                  kind: 'global',
                },
                sphereAlignment: 'time',
              },
            ],
          },
          failureMetadata: {
            effects: [
              {
                kind: 'bond_change',
                withAgentId: '$cast:reeve',
                sentimentDelta: -0.15,
                trustDelta: -0.12,
              },
              {
                kind: 'reputation_with',
                targetLocationId: '$here',
                delta: -0.08,
              },
              {
                kind: 'thread_weaken',
                ascendantId: '$ascendant',
                mortalId: '$actor',
                reason: 'The god watched the blame land',
              },
              {
                kind: 'emit_omen',
                category: 'cultural',
                intensity: 0.3,
                narrativeHook: 'A carved passage was found under a lord\'s tithe barn with a stranger waiting in it, and the '
                  + 'country round says the old passages bring bad luck to whoever walks them.',
                scope: {
                  kind: 'global',
                },
                sphereAlignment: 'darkness',
              },
            ],
          },
          deal: {
            count: 4,
            tags: ['shadow', 'social'],
          },
          nudges: [
            {
              id: 'barn.stretch_the_small_hours',
              name: 'Stretch The Small Hours',
              sphere: 'time',
              essenceCost: 2,
              forecastDelta: 0.12,
              imageTag: 'generic.time-slow',
              effectLine: 'Hold back the dawn a little, so a patient watcher has longer in the dark.',
              bandProse: {
                success: 'The night ran long, and the elder came down before the grey showed.',
                failure: 'The dark held on past its hour, and the elder still did not come.',
                critical_failure: 'The long night gave the elder time to hear them breathing in the passage.',
              },
            },
          ],
        },
        negative: {
          reach: 'shadow',
          duration: {
            min: 1,
            max: 2,
          },
          difficulty: 0.66,
          purposeLine: 'Return the grain unseen',
          onSuccess: [],
          onFailure: [],
          failBehavior: 'fail_action',
          narrativeTemplate: 'Under the stone, a passage of carved blocks older than the village runs to the cellar of '
            + '{cast:elder}\'s house. The missing grain is in that cellar. Half the houses are short of bread, '
            + 'and {cast:elder} took the grain to feed them. {actor} will not name the elder. The reeve counts '
            + 'the barn again at dawn. Before then {actor} carries the grain back through the passage, a sack '
            + 'at a time, past the reeve\'s men.',
          successAfterimage: 'The last sack went back up through the floor before the reeve came to count.',
          failureAfterimage: 'The reeve\'s men caught them coming up through the floor with a sack on their back.',
          successAtCostAfterimage: 'The sacks went back, and the reeve\'s count came up one short.',
          criticalSuccessAfterimage: 'Every sack was back on the barn floor, and the reeve counted the tithe whole.',
          criticalFailureAfterimage: 'The reeve was waiting in the barn when they came up with the first sack.',
          successMetadata: {
            effects: [
              {
                kind: 'bond_change',
                withAgentId: '$cast:elder',
                sentimentDelta: 0.12,
                trustDelta: 0.1,
              },
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: 0.3,
                label: 'the carved passage under the tithe barn',
                targetAgentId: '$actor',
                revealFamilies: ['shadow', 'settlement'],
              },
              {
                kind: 'thread_strengthen',
                ascendantId: '$ascendant',
                mortalId: '$actor',
                reason: 'The god kept close in the dark',
              },
            ],
          },
          failureMetadata: {
            effects: [
              {
                kind: 'bond_change',
                withAgentId: '$cast:reeve',
                sentimentDelta: -0.15,
                trustDelta: -0.12,
              },
              {
                kind: 'reputation_with',
                targetLocationId: '$here',
                delta: -0.08,
              },
              {
                kind: 'thread_weaken',
                ascendantId: '$ascendant',
                mortalId: '$actor',
                reason: 'The god watched the blame land',
              },
              {
                kind: 'emit_omen',
                category: 'cultural',
                intensity: 0.3,
                narrativeHook: 'A figure was seen climbing out of the floor of a lord\'s tithe barn with the tithe on their '
                  + 'back, and the country round says the old passages under the barns are walked again.',
                scope: {
                  kind: 'global',
                },
                sphereAlignment: 'darkness',
              },
            ],
          },
          deal: {
            count: 4,
            tags: ['shadow', 'labor'],
          },
          nudges: [
            {
              id: 'barn.ease_the_burden',
              name: 'Ease The Burden',
              sphere: 'matter',
              essenceCost: 2,
              forecastDelta: 0.12,
              imageTag: 'generic.matter',
              effectLine: 'Make every load sit light and quiet on the back, so a carrier moves faster and makes no sound.',
              bandProse: {
                critical_success: 'The sacks sat light on their back, and the old steps took the weight without a sound.',
                success_at_cost: 'The sacks went quick and quiet, and one split on the last step.',
                failure: 'The sacks rode easy, so they carried too many at once past a waking guard.',
                critical_failure: 'The sacks sat so light that they hurried, straight into the reeve\'s lantern.',
              },
            },
          ],
        },
      },
      fallback: {
        reach: 'shadow',
        duration: {
          min: 1,
          max: 2,
        },
        difficulty: 0.66,
        purposeLine: 'Catch the grain moving',
        onSuccess: [],
        onFailure: [],
        failBehavior: 'fail_action',
        narrativeTemplate: 'Under the stone, a passage of carved blocks older than the village runs to the cellar of '
          + '{cast:elder}\'s house. The missing grain is in that cellar. Half the houses are short of bread, '
          + 'and {cast:elder} took the grain to feed them. {actor} names the elder to the reeve. The reeve '
          + 'will not take a suspect\'s word. The grain goes out to the houses tonight, and {actor} must '
          + 'catch it moving.',
        successAfterimage: 'The reeve came down the steps and found the elder with a sack on each shoulder.',
        failureAfterimage: 'The elder never came, and the reeve found them alone in the passage.',
        successAtCostAfterimage: 'They caught the elder, but half the sacks were already shared out.',
        criticalSuccessAfterimage: 'They waited in the dark passage until the elder came, and fetched the reeve without a sound.',
        criticalFailureAfterimage: 'The elder heard them in the dark, and the reeve found them alone beside the grain.',
        successMetadata: {
          effects: [
            {
              kind: 'bond_change',
              withAgentId: '$cast:reeve',
              sentimentDelta: 0.12,
              trustDelta: 0.1,
            },
            {
              kind: 'bond_change',
              withAgentId: '$cast:elder',
              sentimentDelta: -0.15,
            },
            {
              kind: 'reputation_with',
              targetLocationId: '$here',
              delta: 0.05,
            },
            {
              kind: 'thread_strengthen',
              ascendantId: '$ascendant',
              mortalId: '$actor',
              reason: 'The god kept close in the dark',
            },
            {
              kind: 'emit_omen',
              category: 'cultural',
              intensity: 0.3,
              narrativeHook: 'A carved passage older than any village was found under a lord\'s tithe barn, and the country '
                + 'round says the old passages are opening again.',
              scope: {
                kind: 'global',
              },
              sphereAlignment: 'time',
            },
          ],
        },
        failureMetadata: {
          effects: [
            {
              kind: 'bond_change',
              withAgentId: '$cast:reeve',
              sentimentDelta: -0.15,
              trustDelta: -0.12,
            },
            {
              kind: 'reputation_with',
              targetLocationId: '$here',
              delta: -0.08,
            },
            {
              kind: 'thread_weaken',
              ascendantId: '$ascendant',
              mortalId: '$actor',
              reason: 'The god watched the blame land',
            },
            {
              kind: 'emit_omen',
              category: 'cultural',
              intensity: 0.3,
              narrativeHook: 'A carved passage was found under a lord\'s tithe barn with a stranger waiting in it, and the '
                + 'country round says the old passages bring bad luck to whoever walks them.',
              scope: {
                kind: 'global',
              },
              sphereAlignment: 'darkness',
            },
          ],
        },
        deal: {
          count: 4,
          tags: ['shadow', 'social'],
        },
        nudges: [
          {
            id: 'barn.stretch_the_small_hours',
            name: 'Stretch The Small Hours',
            sphere: 'time',
            essenceCost: 2,
            forecastDelta: 0.12,
            imageTag: 'generic.time-slow',
            effectLine: 'Hold back the dawn a little, so a patient watcher has longer in the dark.',
            bandProse: {
              success: 'The night ran long, and the elder came down before the grey showed.',
              failure: 'The dark held on past its hour, and the elder still did not come.',
              critical_failure: 'The long night gave the elder time to hear them breathing in the passage.',
            },
          },
        ],
      },
    },
  ],
  traitVariants: [
    {
      traitId: 'trait.reputation.shadow.negative',
      forecastDelta: -0.05,
      factorLine: 'They are Infamous; every watchman looks for their face first.',
    },
    {
      traitId: 'trait.reputation.shadow.positive',
      forecastDelta: 0.04,
      factorLine: 'They are Enigmatic; few in the village know their face.',
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'reeve',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['steward'],
      supportRole: 'tithe_reeve',
      spawnNpcRole: 'steward',
      spawnName: 'Aldric Venn',
    },
    {
      kind: 'actor',
      key: 'elder',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['elder'],
      supportRole: 'village_elder',
      spawnNpcRole: 'elder',
      spawnName: 'Maud Ashby',
    },
  ],
  narrativeTemplates: {
    initiation: 'The lord\'s tithe barn has been robbed with no lock broken, and the reeve names {actor} as the '
      + 'only one who could.',
    success: 'The reeve has the tithe grain back and has opened the road.',
    failure: '{location} takes {actor} for the tithe thief.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      positive: {
        overview: '{actor} named the elder to the reeve.',
        changes: [],
        byOutcome: {
          critical_success: {
            overview: 'The reeve caught {cast:elder} with the first sack and opened the road that morning. The reeve '
              + 'told {location} who had found the thief. The hungry houses get none of the grain. The village '
              + 'calls the passage under the barn a sign of good luck.',
            changes: [
              {
                id: 'barn.crit.reeve_regard',
                kind: 'reputation',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'The Reeve\'s Regard',
                detail: '{cast:reeve} no longer counts {actor} a suspect.',
                stateNoun: {
                  text: 'reputation',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: 'no longer counts',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
              {
                id: 'barn.crit.village_regard',
                kind: 'reputation',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'Cleared in the Village',
                detail: '{location} thinks better of {actor}.',
                stateNoun: {
                  text: 'reputation with {target}',
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
              },
              {
                id: 'barn.crit.thread',
                kind: 'growth',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'A Thread Drawn Tight',
                causeClause: 'The god kept close in the dark',
                detail: 'The thread to {actor} runs stronger.',
                stateNoun: {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
                concepts: [
                  {
                    text: 'thread',
                    tooltipId: 'ui.thread',
                  },
                ],
              },
            ],
          },
          success: {
            overview: 'The reeve took the grain back from {cast:elder} and opened the road by noon. The hungry houses '
              + 'get none of it. The village calls the passage under the barn a sign of good luck.',
            changes: [
              {
                id: 'barn.win.reeve_regard',
                kind: 'reputation',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'The Reeve\'s Regard',
                detail: '{cast:reeve} no longer counts {actor} a suspect.',
                stateNoun: {
                  text: 'reputation',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: 'no longer counts',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
              {
                id: 'barn.win.village_regard',
                kind: 'reputation',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'Cleared in the Village',
                detail: '{location} thinks better of {actor}.',
                stateNoun: {
                  text: 'reputation with {target}',
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
              },
              {
                id: 'barn.win.thread',
                kind: 'growth',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'A Thread Drawn Tight',
                causeClause: 'The god kept close in the dark',
                detail: 'The thread to {actor} runs stronger.',
                stateNoun: {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
                concepts: [
                  {
                    text: 'thread',
                    tooltipId: 'ui.thread',
                  },
                ],
              },
            ],
          },
          success_at_cost: {
            overview: 'Half the grain had already gone into the village\'s bread. The reeve took back the rest and '
              + 'opened the road. The village calls the passage under the barn a sign of good luck.',
            changes: [
              {
                id: 'barn.cost.reeve_regard',
                kind: 'reputation',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'The Reeve\'s Regard',
                detail: '{cast:reeve} no longer counts {actor} a suspect.',
                stateNoun: {
                  text: 'reputation',
                  tooltipId: 'ui.reputation_with',
                },
                concepts: [
                  {
                    text: 'no longer counts',
                    tooltipId: 'ui.standing',
                  },
                ],
              },
              {
                id: 'barn.cost.village_regard',
                kind: 'reputation',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'Cleared in the Village',
                detail: '{location} thinks better of {actor}.',
                stateNoun: {
                  text: 'reputation with {target}',
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
              },
              {
                id: 'barn.cost.thread',
                kind: 'growth',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'A Thread Drawn Tight',
                causeClause: 'The god kept close in the dark',
                detail: 'The thread to {actor} runs stronger.',
                stateNoun: {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
                concepts: [
                  {
                    text: 'thread',
                    tooltipId: 'ui.thread',
                  },
                ],
              },
            ],
          },
          failure: {
            overview: 'The reeve takes {actor}\'s night in the passage as proof of the theft, and {location} now calls '
              + '{actor} the tithe thief. The village calls the passage under the barn a sign of bad luck.',
            changes: [
              {
                id: 'barn.lost.village_regard',
                kind: 'reputation',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'Lower in the Village',
                detail: '{location} thinks less of {actor}.',
                stateNoun: {
                  text: 'reputation with {target}',
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
                id: 'barn.lost.reeve_doubt',
                kind: 'reputation',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'The Reeve\'s Doubt',
                detail: '{cast:reeve} trusts {actor}\'s word less.',
                stateNoun: {
                  text: 'reputation',
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
                id: 'barn.lost.thread',
                kind: 'growth',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'A Thread Worn Thin',
                causeClause: 'The god watched the blame land',
                detail: 'The thread to {actor} runs thinner.',
                stateNoun: {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
                concepts: [
                  {
                    text: 'thread',
                    tooltipId: 'ui.thread',
                  },
                ],
              },
            ],
          },
          critical_failure: {
            overview: 'The reeve told every house in {location} that the best sneak in the country had robbed the lord. '
              + 'The village calls the passage under the barn a sign of bad luck.',
            changes: [
              {
                id: 'barn.caught.village_regard',
                kind: 'reputation',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'Lower in the Village',
                detail: '{location} thinks less of {actor}.',
                stateNoun: {
                  text: 'reputation with {target}',
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
                id: 'barn.caught.reeve_doubt',
                kind: 'reputation',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'The Reeve\'s Doubt',
                detail: '{cast:reeve} trusts {actor}\'s word less.',
                stateNoun: {
                  text: 'reputation',
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
                id: 'barn.caught.thread',
                kind: 'growth',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'A Thread Worn Thin',
                causeClause: 'The god watched the blame land',
                detail: 'The thread to {actor} runs thinner.',
                stateNoun: {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
                concepts: [
                  {
                    text: 'thread',
                    tooltipId: 'ui.thread',
                  },
                ],
              },
            ],
          },
        },
      },
      negative: {
        overview: '{actor} tried to return the tithe grain unseen.',
        changes: [],
        byOutcome: {
          critical_success: {
            overview: 'The reeve called the lost cartload a miscount and opened the road at dawn. {cast:elder} left a '
              + 'loaf on {actor}\'s pack without a word.',
            changes: [
              {
                id: 'barn.back.crit.thread',
                kind: 'growth',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'A Thread Drawn Tight',
                causeClause: 'The god kept close in the dark',
                detail: 'The thread to {actor} runs stronger.',
                stateNoun: {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
                concepts: [
                  {
                    text: 'thread',
                    tooltipId: 'ui.thread',
                  },
                ],
              },
              {
                id: 'barn.back.crit.the_passage',
                kind: 'future_hook',
                category: 'path',
                direction: 'opens',
                polarity: 'info',
                title: 'The Passage Under the Barn',
                detail: '{actor} knows of the carved passage under the tithe barn.',
                stateNoun: {
                  text: 'hidden mark',
                  tooltipId: 'ui.hidden_mark',
                },
                concepts: [
                  {
                    text: 'carved passage under the tithe barn',
                    tooltipId: 'ui.hidden_mark',
                  },
                ],
              },
            ],
          },
          success: {
            overview: 'The reeve found the tithe whole at dawn, called the lost cartload a miscount, and opened the '
              + 'road.',
            changes: [
              {
                id: 'barn.back.win.thread',
                kind: 'growth',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'A Thread Drawn Tight',
                causeClause: 'The god kept close in the dark',
                detail: 'The thread to {actor} runs stronger.',
                stateNoun: {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
                concepts: [
                  {
                    text: 'thread',
                    tooltipId: 'ui.thread',
                  },
                ],
              },
              {
                id: 'barn.back.win.the_passage',
                kind: 'future_hook',
                category: 'path',
                direction: 'opens',
                polarity: 'info',
                title: 'The Passage Under the Barn',
                detail: '{actor} knows of the carved passage under the tithe barn.',
                stateNoun: {
                  text: 'hidden mark',
                  tooltipId: 'ui.hidden_mark',
                },
                concepts: [
                  {
                    text: 'carved passage under the tithe barn',
                    tooltipId: 'ui.hidden_mark',
                  },
                ],
              },
            ],
          },
          success_at_cost: {
            overview: 'The reeve opened the road, but told {location} that one sack of the tithe is still owed.',
            changes: [
              {
                id: 'barn.back.cost.thread',
                kind: 'growth',
                category: 'bond',
                direction: 'gain',
                polarity: 'gain',
                title: 'A Thread Drawn Tight',
                causeClause: 'The god kept close in the dark',
                detail: 'The thread to {actor} runs stronger.',
                stateNoun: {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
                concepts: [
                  {
                    text: 'thread',
                    tooltipId: 'ui.thread',
                  },
                ],
              },
              {
                id: 'barn.back.cost.the_passage',
                kind: 'future_hook',
                category: 'path',
                direction: 'opens',
                polarity: 'info',
                title: 'The Passage Under the Barn',
                detail: '{actor} knows of the carved passage under the tithe barn.',
                stateNoun: {
                  text: 'hidden mark',
                  tooltipId: 'ui.hidden_mark',
                },
                concepts: [
                  {
                    text: 'carved passage under the tithe barn',
                    tooltipId: 'ui.hidden_mark',
                  },
                ],
              },
            ],
          },
          failure: {
            overview: 'The reeve counts the sack on {actor}\'s back as proof, and {location} now calls {actor} the '
              + 'tithe thief. The village says the old passages under the barns are walked again.',
            changes: [
              {
                id: 'barn.back.lost.village_regard',
                kind: 'reputation',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'Lower in the Village',
                detail: '{location} thinks less of {actor}.',
                stateNoun: {
                  text: 'reputation with {target}',
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
                id: 'barn.back.lost.reeve_doubt',
                kind: 'reputation',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'The Reeve\'s Doubt',
                detail: '{cast:reeve} trusts {actor}\'s word less.',
                stateNoun: {
                  text: 'reputation',
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
                id: 'barn.back.lost.thread',
                kind: 'growth',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'A Thread Worn Thin',
                causeClause: 'The god watched the blame land',
                detail: 'The thread to {actor} runs thinner.',
                stateNoun: {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
                concepts: [
                  {
                    text: 'thread',
                    tooltipId: 'ui.thread',
                  },
                ],
              },
            ],
          },
          critical_failure: {
            overview: 'The reeve showed all of {location} the passage under the barn and the sack on {actor}\'s back. '
              + 'The village now calls {actor} the tithe thief and says the old passages under the barns are '
              + 'walked again.',
            changes: [
              {
                id: 'barn.back.caught.village_regard',
                kind: 'reputation',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'Lower in the Village',
                detail: '{location} thinks less of {actor}.',
                stateNoun: {
                  text: 'reputation with {target}',
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
                id: 'barn.back.caught.reeve_doubt',
                kind: 'reputation',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'The Reeve\'s Doubt',
                detail: '{cast:reeve} trusts {actor}\'s word less.',
                stateNoun: {
                  text: 'reputation',
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
                id: 'barn.back.caught.thread',
                kind: 'growth',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'A Thread Worn Thin',
                causeClause: 'The god watched the blame land',
                detail: 'The thread to {actor} runs thinner.',
                stateNoun: {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
                concepts: [
                  {
                    text: 'thread',
                    tooltipId: 'ui.thread',
                  },
                ],
              },
            ],
          },
        },
      },
    },
    fallback: {
      overview: '{actor} named the elder to the reeve.',
      changes: [],
      byOutcome: {
        critical_success: {
          overview: 'The reeve caught {cast:elder} with the first sack and opened the road that morning. The reeve '
            + 'told {location} who had found the thief. The hungry houses get none of the grain. The village '
            + 'calls the passage under the barn a sign of good luck.',
          changes: [
            {
              id: 'barn.fb.crit.reeve_regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Reeve\'s Regard',
              detail: '{cast:reeve} no longer counts {actor} a suspect.',
              stateNoun: {
                text: 'reputation',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'no longer counts',
                  tooltipId: 'ui.standing',
                },
              ],
            },
            {
              id: 'barn.fb.crit.village_regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'Cleared in the Village',
              detail: '{location} thinks better of {actor}.',
              stateNoun: {
                text: 'reputation with {target}',
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
            },
            {
              id: 'barn.fb.crit.thread',
              kind: 'growth',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'A Thread Drawn Tight',
              causeClause: 'The god kept close in the dark',
              detail: 'The thread to {actor} runs stronger.',
              stateNoun: {
                text: 'thread',
                tooltipId: 'ui.thread',
              },
              concepts: [
                {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
              ],
            },
          ],
        },
        success: {
          overview: 'The reeve took the grain back from {cast:elder} and opened the road by noon. The hungry houses '
            + 'get none of it. The village calls the passage under the barn a sign of good luck.',
          changes: [
            {
              id: 'barn.fb.win.reeve_regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Reeve\'s Regard',
              detail: '{cast:reeve} no longer counts {actor} a suspect.',
              stateNoun: {
                text: 'reputation',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'no longer counts',
                  tooltipId: 'ui.standing',
                },
              ],
            },
            {
              id: 'barn.fb.win.village_regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'Cleared in the Village',
              detail: '{location} thinks better of {actor}.',
              stateNoun: {
                text: 'reputation with {target}',
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
            },
            {
              id: 'barn.fb.win.thread',
              kind: 'growth',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'A Thread Drawn Tight',
              causeClause: 'The god kept close in the dark',
              detail: 'The thread to {actor} runs stronger.',
              stateNoun: {
                text: 'thread',
                tooltipId: 'ui.thread',
              },
              concepts: [
                {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview: 'Half the grain had already gone into the village\'s bread. The reeve took back the rest and '
            + 'opened the road. The village calls the passage under the barn a sign of good luck.',
          changes: [
            {
              id: 'barn.fb.cost.reeve_regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Reeve\'s Regard',
              detail: '{cast:reeve} no longer counts {actor} a suspect.',
              stateNoun: {
                text: 'reputation',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'no longer counts',
                  tooltipId: 'ui.standing',
                },
              ],
            },
            {
              id: 'barn.fb.cost.village_regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'Cleared in the Village',
              detail: '{location} thinks better of {actor}.',
              stateNoun: {
                text: 'reputation with {target}',
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
            },
            {
              id: 'barn.fb.cost.thread',
              kind: 'growth',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'A Thread Drawn Tight',
              causeClause: 'The god kept close in the dark',
              detail: 'The thread to {actor} runs stronger.',
              stateNoun: {
                text: 'thread',
                tooltipId: 'ui.thread',
              },
              concepts: [
                {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
              ],
            },
          ],
        },
        failure: {
          overview: 'The reeve takes {actor}\'s night in the passage as proof of the theft, and {location} now calls '
            + '{actor} the tithe thief. The village calls the passage under the barn a sign of bad luck.',
          changes: [
            {
              id: 'barn.fb.lost.village_regard',
              kind: 'reputation',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Lower in the Village',
              detail: '{location} thinks less of {actor}.',
              stateNoun: {
                text: 'reputation with {target}',
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
              id: 'barn.fb.lost.reeve_doubt',
              kind: 'reputation',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'The Reeve\'s Doubt',
              detail: '{cast:reeve} trusts {actor}\'s word less.',
              stateNoun: {
                text: 'reputation',
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
              id: 'barn.fb.lost.thread',
              kind: 'growth',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'A Thread Worn Thin',
              causeClause: 'The god watched the blame land',
              detail: 'The thread to {actor} runs thinner.',
              stateNoun: {
                text: 'thread',
                tooltipId: 'ui.thread',
              },
              concepts: [
                {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview: 'The reeve told every house in {location} that the best sneak in the country had robbed the lord. '
            + 'The village calls the passage under the barn a sign of bad luck.',
          changes: [
            {
              id: 'barn.fb.caught.village_regard',
              kind: 'reputation',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Lower in the Village',
              detail: '{location} thinks less of {actor}.',
              stateNoun: {
                text: 'reputation with {target}',
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
              id: 'barn.fb.caught.reeve_doubt',
              kind: 'reputation',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'The Reeve\'s Doubt',
              detail: '{cast:reeve} trusts {actor}\'s word less.',
              stateNoun: {
                text: 'reputation',
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
              id: 'barn.fb.caught.thread',
              kind: 'growth',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'A Thread Worn Thin',
              causeClause: 'The god watched the blame land',
              detail: 'The thread to {actor} runs thinner.',
              stateNoun: {
                text: 'thread',
                tooltipId: 'ui.thread',
              },
              concepts: [
                {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
              ],
            },
          ],
        },
      },
      reactions: [],
    },
  },
  description: 'An expert shadow job turned inside out: the lord\'s reeve blames the mortal for a tithe-barn '
    + 'theft only an expert could manage. Search the watched barn for the way in, then either name the '
    + 'village elder who took the grain for the hungry houses and catch it moving (a Confessor), or '
    + 'carry it back through the carved passage before the dawn count (a Puppeteer).',
  locationSubtypes: expandSettings(['rural']),
  consequenceDraw: ['thread', 'omen'],
};

export const TITHE_BARN_RAID_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
