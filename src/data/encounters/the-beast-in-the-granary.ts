/**
 * The Beast in the Granary — a bear denned three days on a settlement's winter
 * store; two men who went in were carried out; the settlement is one argument
 * from burning the building down with the bear inside it. The agent's own goods
 * are behind that bar. Cross the dark floor to reach the pack, then find out —
 * by nature, not by choice — whether the mortal stays to save the store or takes
 * what is theirs and goes.
 * 
 * Rolled constraints (approved brief, non-negotiable): plotHookTaken:
 * hook.impossible_heist · reach shadow (lead) · setting rolled rural · scale
 * settlement · shape personality_fork · p3Shape choice · opposition beast
 * (motive: hunger) · activity sleeping · disposition wary · agentRole the
 * client who is owed · consequenceDraw: possession, membership.
 * 
 * ── The fork (THR-894 personality_fork, ActionStepBranch) ──
 * One plain step (the crossing, step 0) + one agent-decided branch on
 * `sacrifice_survival` (Star — Martyr `positive` / Survivor `negative`), read
 * from the mortal's standing value plus the net poleLean of the cards the god
 * committed on step 0. The player never picks — the two step-0 specials
 * (`granary.wake_their_fear` leans negative/survival, `granary.weigh_the_winter`
 * leans positive/sacrifice) are the god's only lever on which pole the mortal
 * reads into. `positive` continues at `iron` difficulty 0.44 (Put It Out — drive
 * the bear out the far door and save the store); `negative` continues at
 * `shadow` difficulty 0.36 (Get Back Out — take the pack and let the settlement
 * burn the store in the morning). No convergence: the two poles resolve to
 * different aftermath variants and leave the settlement in opposite states.
 * 
 * Step 0 is `continue_weakened` and mints the pack (`spawn_artifact`) on
 * `successMetadata` only — a failed-but-continuing crossing reaches the fork
 * with no artifact spawned. Both branch continuations are therefore written to
 * state position, never possession.
 * 
 * ── Narrator's checklist (12 questions) — PASS on all, verified in the systems
 * and editorial passes ──
 * P1 arrival + P2 situation/cost-already-paid + P3 one stake shape (`choice`)
 * at 79/80 words; every sentence a narrator's report, nothing felt or staged;
 * every fact introduced before a card acts on it (keeper/watch/bins/bear/grain
 * in the spine, both doors and the pack in the branch prose); one named person
 * on stage per beat (the keeper in beat 1, nobody but the agent and the animal
 * in beat 2); all three declared classes (rural/wayside/stronghold) have an
 * opening.
 * 
 * ── Findings for the batch report (not worked around in content) ──
 * 1. No non-human cast primitive — `NpcRole` is all-human, so the bear cannot
 *    be a bound scene actor and every card acting on it attributes to the
 *    card, never `opposes` a cast key. Will recur across every
 *    `encounter.hunt.*` member.
 * 2. `civic_guard` is a def-id anchor, not a node-id anchor —
 *    `resolveFactionNodeId` can, in a multi-chapter world, enroll the agent in
 *    a chapter unrelated to this settlement. No content-side fix.
 * 3-11. Composed-hand rule ownership gaps on dealt fill, `deal.exclude`
 *    type-vs-member mismatch, Law 56/reaction-pick tension on the membership
 *    chip, no `encounter_seed` (single-member family), and the Composition
 *    Contract's blindness to `ActionStepBranch` variants (hands, forecast
 *    arithmetic and grant liveness on both branch steps are unchecked by
 *    `check:encounter`, though the register/prose detectors do reach them).
 *    Full detail: `Docs/plans/encounters/the-beast-in-the-granary-final.md`
 *    § Findings for the batch report.
 * 
 * ── Trait hooks (mandatory four questions) ──
 * Gate? No — open-draw, gates on nothing. Variant? Yes,
 * `trait.core.core_warmth.virtue` — a Warm mortal is the one the
 * sacrifice/survival axis was written for. Trait-only nudge? No — the specials
 * budget is spent on the two cards the dealer structurally cannot produce.
 * Trait fragment? No — carried by the variant's factor line.
 * 
 * No authored `factorLines` beyond the one `TraitVariant.factorLine` (variance
 * rule, THR-892): everything else is priced into difficulty and carried by
 * prose. All three step difficulties (0.40 / 0.44 / 0.36) sit at or under
 * `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45) — `intrinsicTier: 'background'`,
 * an open draw.
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
  id: 'encounter.hunt.the_beast_in_the_granary',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'The Beast in the Granary',
  reach: 'shadow',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['sacrifice_survival'],
  settings: ['rural', 'wayside', 'stronghold'],
  openings: {
    rural: '{name} reaches the village of {location} after dark.',
    wayside: 'Travelling late, {name} stops at the waystation of {location}.',
    stronghold: '{name} is inside the gate at {location} before dark.',
  },
  steps: [
    {
      reach: 'shadow',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.4,
      purposeLine: 'Cross the floor',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'There the store is barred, and {cast:keeper} of the watch will not open it. A bear has denned '
        + 'inside, asleep on the bins of winter grain. Two men who went in were carried out.\n\n'
        + '{name}\'s pack went behind that bar at dusk, by local rule. Rouse the settlement and they burn '
        + 'the store to be rid of it. Go in quiet, and the bear lies between {name} and the door.',
      criticalSuccessAfterimage: 'They crossed without a board speaking and had a hand on the pack before the animal shifted.',
      successAfterimage: 'They got across the dark floor and reached the pack.',
      successAtCostAfterimage: 'They reached the pack, and the crossing took twice the time it should have.',
      failureAfterimage: 'The crossing went badly. They reached the pack carrying claw-marks they did not walk in with.',
      criticalFailureAfterimage: 'The animal came up off the grain and put them into the boards before they were across.',
      successMetadata: {
        effects: [
          {
            kind: 'spawn_artifact',
            category: 'mundane',
            tier: 'common',
            targetAgentId: '$actor',
          },
        ],
      },
      failureMetadata: {
        effects: [
          {
            kind: 'condition_attachment',
            templateId: 'trait.condition.wounded',
            targetAgentId: '$actor',
          },
        ],
      },
      deal: {
        count: 4,
        tags: ['shadow', 'peril'],
        exclude: ['boost', 'undertow'],
      },
      nudges: [
        {
          id: 'granary.wake_their_fear',
          name: 'Wake Their Fear',
          sphere: 'mind',
          essenceCost: 2,
          forecastDelta: 0.08,
          imageTag: 'generic.dark',
          poleLean: {
            axis: 'sacrifice_survival',
            toward: 'negative',
          },
          grants: [
            {
              kind: 'condition_attachment',
              templateId: 'trait.condition.terrified',
              targetAgentId: '$actor',
            },
          ],
          effectLine: 'Fill them with dread of the sleeping animal. They move carefully, and they will want the door.',
          bandProse: {
            success: 'Fear kept every step short, and the floor stayed quiet under them.',
            near_miss: 'Dread had them counting the boards. It did not have them counting the time.',
            failure: 'Dread made them careful, and careful was not the same as quiet.',
          },
        },
        {
          id: 'granary.weigh_the_winter',
          name: 'Weigh The Winter',
          sphere: 'light',
          essenceCost: 0,
          costs: {
            detectionDelta: 3,
          },
          forecastDelta: 0.06,
          imageTag: 'generic.light',
          poleLean: {
            axis: 'sacrifice_survival',
            toward: 'positive',
          },
          effectLine: 'Show them the floor and every bin on it — the grain, and how many mouths it feeds. Rival gods '
            + 'will read the light.',
          bandProse: {
            critical_success: 'They had the whole floor mapped before they moved, bin by bin.',
            success: 'The light showed the bins and the gaps between them, and they used both.',
            failure: 'They saw exactly how much was in there, and looked a moment too long.',
          },
        },
      ],
    },
    {
      branchOnStep: 0,
      decidedBy: {
        axis: 'sacrifice_survival',
      },
      variants: {
        positive: {
          reach: 'iron',
          duration: {
            min: 1,
            max: 2,
          },
          difficulty: 0.44,
          purposeLine: 'Put it out',
          onSuccess: [],
          onFailure: [],
          failBehavior: 'fail_action',
          narrativeTemplate: '{name} reaches the pack and stops. The bear is asleep across the floor, and every bin of the '
            + 'settlement\'s winter sits behind it.\n\n'
            + 'There is a second door at the far end, barred from the inside. A bear will go toward cold air if '
            + 'there is cold air to go toward. {They} leave the pack by the near door and go the long way '
            + 'round.',
          criticalSuccessAfterimage: 'They opened the far door and walked the animal out of the building without laying a hand on it.',
          successAfterimage: 'They got the far door open, and the bear went out through it.',
          successAtCostAfterimage: 'The bear went out the far door, and took a rack of the store\'s fittings with it.',
          failureAfterimage: 'The far door came open and the bear stayed where it was, on the grain.',
          criticalFailureAfterimage: 'They put themselves between a bear and its food, and the bear settled it.',
          successMetadata: {
            effects: [
              {
                kind: 'condition_attachment',
                templateId: 'trait.condition.location.festival',
                targetLocationId: '$target',
              },
            ],
          },
          failureMetadata: {
            effects: [
              {
                kind: 'condition_attachment',
                templateId: 'trait.condition.wounded',
                targetAgentId: '$actor',
              },
              {
                kind: 'condition_attachment',
                templateId: 'trait.condition.location.harvest_blight',
                targetLocationId: '$target',
              },
            ],
          },
          deal: {
            count: 4,
            tags: ['might', 'peril'],
            exclude: ['boost', 'undertow'],
          },
          nudges: [
            {
              id: 'granary.lift_the_bar',
              name: 'Lift The Bar',
              sphere: 'chaos',
              essenceCost: 2,
              forecastDelta: 0.1,
              imageTag: 'generic.matter',
              effectLine: 'Open the far door from the inside and let the night in — the bear will go toward the cold.',
              bandProse: {
                critical_success: 'The night came in the far end of the building and the animal followed it out.',
                success: 'The far end of the store went cold, and the bear went to find out why.',
                near_miss: 'The cold reached the bear. It looked, and then it went back to the grain.',
                failure: 'The far door stood open on a night the bear had no interest in.',
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
          difficulty: 0.36,
          purposeLine: 'Get back out',
          onSuccess: [],
          onFailure: [],
          failBehavior: 'fail_action',
          narrativeTemplate: '{name} has a hand on the pack, and the near door is four steps of open board away.\n\n'
            + 'The bins behind the sleeping bear are not {name}\'s and never were. The animal is close enough '
            + 'to both the pack and the door.',
          criticalSuccessAfterimage: 'They went out the near door with the pack, and the animal never lifted its head.',
          successAfterimage: 'They took what was theirs and got back out the near door.',
          successAtCostAfterimage: 'They got out with the pack, and a bin went over in the dark behind them.',
          failureAfterimage: 'The bear woke between them and the near door, and they went out through it hurt.',
          criticalFailureAfterimage: 'They went at the near door too fast, and the animal caught them at it.',
          successMetadata: {
            effects: [
              {
                kind: 'condition_attachment',
                templateId: 'trait.condition.location.harvest_blight',
                targetLocationId: '$target',
              },
            ],
          },
          failureMetadata: {
            effects: [
              {
                kind: 'condition_attachment',
                templateId: 'trait.condition.wounded',
                targetAgentId: '$actor',
              },
              {
                kind: 'condition_attachment',
                templateId: 'trait.condition.location.harvest_blight',
                targetLocationId: '$target',
              },
            ],
          },
          deal: {
            count: 4,
            tags: ['shadow', 'finesse'],
            exclude: ['boost', 'undertow'],
          },
          nudges: [
            {
              id: 'granary.narrow_their_sight',
              name: 'Narrow Their Sight',
              sphere: 'darkness',
              essenceCost: 2,
              forecastDelta: 0.16,
              imageTag: 'generic.dark',
              grants: [
                {
                  kind: 'axiological_mark_apply',
                  reach: 'star',
                  signedMagnitude: -0.1,
                  targetAgentId: '$actor',
                },
              ],
              effectLine: 'Dim the whole room except the pack they are holding. They will not weigh the bins again.',
              bandProse: {
                critical_success: 'The pack was all they saw, and they were out the near door with it.',
                success: 'The bins might as well not have been there. They took theirs and left.',
                failure: 'They saw only the pack, and so they did not see the sack their heel found.',
                critical_failure: 'The near door was all they could see, and they went at it too fast.',
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
        difficulty: 0.4,
        purposeLine: 'Decide',
        onSuccess: [],
        onFailure: [],
        failBehavior: 'fail_action',
        narrativeTemplate: '{name} reaches the pack, and what happens next is theirs to decide. The bear is still '
          + 'between them and both doors.',
        criticalSuccessAfterimage: 'They got clear of the store, however it went, with what they came for.',
        successAfterimage: 'They got clear of the store with the pack in hand.',
        successAtCostAfterimage: 'They got clear of the store, and it cost them something to do it.',
        failureAfterimage: 'They did not get clear of the store cleanly.',
        criticalFailureAfterimage: 'They did not get clear of the store, and the bear made sure of it.',
        successMetadata: {
          effects: [],
        },
        failureMetadata: {
          effects: [],
        },
      },
    },
  ],
  traitVariants: [
    {
      traitId: 'trait.core.core_warmth.virtue',
      forecastDelta: 0.04,
      difficultyDelta: -0.02,
      factorLine: 'Being Warm, they do not walk out on a store the whole place eats from.',
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'keeper',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['guard', 'quartermaster', 'elder', 'hunter', 'ranger', 'wanderer'],
      supportRole: 'store_keeper',
      spawnNpcRole: 'guard',
      spawnName: 'Hedda Varn',
      factionDefId: 'civic_guard',
    },
    {
      kind: 'location',
      key: 'store',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      sublocationTypeId: 'sublocation-type.warehouse',
      fallbackName: 'the stores',
    },
  ],
  narrativeTemplates: {
    initiation: 'The store will be opened tonight or burned in the morning. {name} is the only one with a reason '
      + 'to go in first.',
    success: '{name} came out of the store with what was theirs. What is left in there is {location}\'s to '
      + 'settle.',
    failure: '{name} did not get clear of the store cleanly. The bear and the winter are still {location}\'s '
      + 'to answer for, and now there is blood on the boards.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      positive: {
        overview: 'The bear is out of the store, and the grain is standing.',
        changes: [],
        byOutcome: {
          critical_success: {
            overview: 'The animal went out under its own weight and never looked back at the room. {cast:keeper} '
              + 'counted the bins by lamplight, twice, and lost only a burst sack. There will be a feast in '
              + '{location} before the week is out, and {name} will be asked to stay for it.',
            changes: [
              {
                id: 'granary.crit.feast',
                kind: 'trait',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'A Feast Day',
                causeClause: 'The store held through the night and the winter is whole',
                detail: '{location} kept its winter, and will spend three days saying so.',
                stateNoun: {
                  text: 'a feast day',
                  entityId: '$target',
                  visualKind: 'location',
                },
                concepts: [
                  {
                    text: 'a feast day',
                    entityId: '$target',
                    visualKind: 'location',
                  },
                  {
                    text: 'Festival',
                    entityId: 'trait.condition.location.festival',
                    visualKind: 'attachment',
                  },
                ],
              },
              {
                id: 'granary.crit.watch_seat',
                kind: 'future_hook',
                category: 'path',
                direction: 'opens',
                polarity: 'gain',
                title: 'A Place In The Watch',
                causeClause: 'The watch saw who moved the animal off their winter',
                detail: 'The watch at {location} has asked {actor} to stand with them.',
                stateNoun: {
                  text: 'a place in the watch',
                  entityId: '$faction:civic_guard',
                  visualKind: 'faction',
                },
                concepts: [
                  {
                    text: 'a place in the watch',
                    entityId: '$faction:civic_guard',
                    visualKind: 'faction',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'granary.swear_them_in',
                label: 'Let them be sworn to the place',
                intent: 'Significance is belonging. The god lets the mortal put down a root — a name on a roll, a body '
                  + 'they answer to, a place that will now call on them. It costs the god a wanderer and buys a '
                  + 'thread with an address.',
                effects: [
                  {
                    kind: 'membership_change',
                    factionId: 'civic_guard',
                    op: 'join',
                    targetAgentId: '$actor',
                    chronicle: true,
                  },
                ],
              },
              {
                id: 'granary.pay_and_part',
                label: 'Let them be paid and go',
                intent: 'Significance is motion. The god keeps the mortal unowned — settled with, thanked, and gone by '
                  + 'noon. What they carry out is worth more than what they would have been given to guard, and '
                  + 'nobody in {location} will ever have a claim on them.',
                effects: [
                  {
                    kind: 'spawn_artifact',
                    category: 'mundane',
                    tier: 'shaping',
                    targetAgentId: '$actor',
                  },
                ],
              },
            ],
          },
          success: {
            overview: 'The bear is in the fields and the store is standing, and both are true because one traveller '
              + 'walked back into a room they had already got out of. {cast:keeper} opened the door in the '
              + 'morning to a floor that could be swept.',
            changes: [
              {
                id: 'granary.success.feast',
                kind: 'trait',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'A Feast Day',
                causeClause: 'The store held through the night',
                detail: '{location} kept its winter.',
                stateNoun: {
                  text: 'a feast day',
                  entityId: '$target',
                  visualKind: 'location',
                },
                concepts: [
                  {
                    text: 'a feast day',
                    entityId: '$target',
                    visualKind: 'location',
                  },
                  {
                    text: 'Festival',
                    entityId: 'trait.condition.location.festival',
                    visualKind: 'attachment',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'granary.swear_them_in',
                label: 'Let them be sworn to the place',
                intent: 'Significance is belonging. The god lets the mortal put down a root — a name on a roll, a body '
                  + 'they answer to, a place that will now call on them. It costs the god a wanderer and buys a '
                  + 'thread with an address.',
                effects: [
                  {
                    kind: 'membership_change',
                    factionId: 'civic_guard',
                    op: 'join',
                    targetAgentId: '$actor',
                    chronicle: true,
                  },
                ],
              },
              {
                id: 'granary.pay_and_part',
                label: 'Let them be paid and go',
                intent: 'Significance is motion. The god keeps the mortal unowned — settled with, thanked, and gone by '
                  + 'noon. What they carry out is worth more than what they would have been given to guard, and '
                  + 'nobody in {location} will ever have a claim on them.',
                effects: [
                  {
                    kind: 'spawn_artifact',
                    category: 'mundane',
                    tier: 'shaping',
                    targetAgentId: '$actor',
                  },
                ],
              },
            ],
          },
          critical_failure: {
            overview: 'A bear that will not be moved moves the one who tries. {name} came out of the store on their '
              + 'back, the far door standing open and the animal gone into the dark past it. {cast:keeper} put '
              + 'fire to the building at first light anyway, because nobody would go in again to check. '
              + '{location} lost the winter and kept the bear.',
            changes: [
              {
                id: 'granary.critfail.wound_pos',
                kind: 'trait',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'A Wound',
                causeClause: 'A bear that will not be moved moved them instead',
                detail: '{actor} came out of the store torn open.',
                stateNoun: {
                  text: 'a wound',
                  entityId: 'trait.condition.wounded',
                  visualKind: 'attachment',
                },
                concepts: [
                  {
                    text: 'a wound',
                    entityId: 'trait.condition.wounded',
                    visualKind: 'attachment',
                  },
                ],
              },
              {
                id: 'granary.critfail.blight_pos',
                kind: 'trait',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'A Hungry Season',
                causeClause: 'The store burned with the door left open and the bear still loose',
                detail: '{location} burned its own store and will be short until spring.',
                stateNoun: {
                  text: 'a hungry season',
                  entityId: '$target',
                  visualKind: 'location',
                },
                concepts: [
                  {
                    text: 'a hungry season',
                    entityId: '$target',
                    visualKind: 'location',
                  },
                  {
                    text: 'Blighted Harvest',
                    entityId: 'trait.condition.location.harvest_blight',
                    visualKind: 'attachment',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'granary.close_it_clean',
                label: 'Let the wound close clean',
                intent: 'Mercy is allowed to be simple. The god spends nothing on meaning and just takes the hurt off '
                  + 'them.',
                effects: [
                  {
                    kind: 'remove_condition',
                    conditionTraitId: 'trait.condition.wounded',
                    targetAgentId: '$actor',
                  },
                ],
              },
              {
                id: 'granary.let_it_teach',
                label: 'Let them learn caution',
                intent: 'Some lessons are supposed to be expensive. The god lets the failure teach: the next time someone '
                  + 'else\'s winter is behind a sleeping animal, this mortal weighs the odds before they walk in.',
                effects: [
                  {
                    kind: 'axiological_mark_apply',
                    reach: 'star',
                    signedMagnitude: -0.08,
                    targetAgentId: '$actor',
                  },
                ],
              },
            ],
          },
        },
      },
      negative: {
        overview: 'The pack is out and the store is still barred.',
        changes: [],
        byOutcome: {
          success: {
            overview: 'Four steps, a door, and nobody the wiser. {name} was on the road before it was properly light. '
              + 'Behind them {cast:keeper} was arguing the same argument for the last time, and losing it, and '
              + 'the smoke went up before noon.',
            changes: [
              {
                id: 'granary.neg.success.goods',
                kind: 'growth',
                category: 'boon',
                direction: 'gain',
                polarity: 'gain',
                title: 'Their Own Goods, Back',
                causeClause: 'They took only what was theirs and got clear',
                detail: 'What {actor} was owed came out of the store in {their} own hands.',
                stateNoun: {
                  text: 'their own goods, back',
                  entityId: '$actor',
                  visualKind: 'agent',
                },
                concepts: [
                  {
                    text: 'their own goods, back',
                    entityId: '$actor',
                    visualKind: 'agent',
                  },
                ],
              },
              {
                id: 'granary.neg.success.blight',
                kind: 'trait',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'A Hungry Season',
                causeClause: 'The settlement burned the store at dawn as it had always planned to',
                detail: '{location} burned its own store and will be short until spring.',
                stateNoun: {
                  text: 'a hungry season',
                  entityId: '$target',
                  visualKind: 'location',
                },
                concepts: [
                  {
                    text: 'a hungry season',
                    entityId: '$target',
                    visualKind: 'location',
                  },
                  {
                    text: 'Blighted Harvest',
                    entityId: 'trait.condition.location.harvest_blight',
                    visualKind: 'attachment',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'granary.their_own_time',
                label: 'Let the settlement find it in its own time',
                intent: 'Non-interference, held to the end. The god does not clean up after the mortal and does not '
                  + 'confess for them either. The world will find out or it will not, on its own schedule, and the '
                  + 'god will be watching when it does.',
                effects: [
                  {
                    kind: 'hidden_mark',
                    category: 'concealed_action',
                    severity: 0.4,
                    label: 'Was inside the store the night before it burned',
                    targetAgentId: '$actor',
                    revealFamilies: ['investigation'],
                  },
                ],
              },
              {
                id: 'granary.tell_the_keeper',
                label: 'Let the keeper hear it from them',
                intent: 'You may owe a place the truth even when you took nothing from it. The god leans the mortal into '
                  + 'saying, out loud, what they saw in there — which does not save the store, but means the people '
                  + 'burning it know what they are burning.',
                effects: [
                  {
                    kind: 'intelligence',
                    category: 'cultural_knowledge',
                    label: 'What is actually in the store',
                    detail: 'How large the animal is, where it lies, and how much of the winter is under it.',
                    reliability: 0.9,
                    targetAgentId: '$cast:keeper',
                  },
                ],
              },
            ],
          },
          success_at_cost: {
            overview: 'They got out with theirs. They did not get out unheard. {cast:keeper} found the near bar off its '
              + 'seat and a boot-mark in spilled grain, and by the time the store burned, {location} had two '
              + 'grievances instead of one.',
            changes: [
              {
                id: 'granary.neg.cost.blight',
                kind: 'trait',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'A Hungry Season',
                causeClause: 'The settlement burned the store, and now the store\'s last night has a name attached to it',
                detail: '{location} burned its own store and will be short until spring.',
                stateNoun: {
                  text: 'a hungry season',
                  entityId: '$target',
                  visualKind: 'location',
                },
                concepts: [
                  {
                    text: 'a hungry season',
                    entityId: '$target',
                    visualKind: 'location',
                  },
                  {
                    text: 'Blighted Harvest',
                    entityId: 'trait.condition.location.harvest_blight',
                    visualKind: 'attachment',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'granary.their_own_time',
                label: 'Let the settlement find it in its own time',
                intent: 'Non-interference, held to the end. The god does not clean up after the mortal and does not '
                  + 'confess for them either. The world will find out or it will not, on its own schedule, and the '
                  + 'god will be watching when it does.',
                effects: [
                  {
                    kind: 'hidden_mark',
                    category: 'concealed_action',
                    severity: 0.4,
                    label: 'Was inside the store the night before it burned',
                    targetAgentId: '$actor',
                    revealFamilies: ['investigation'],
                  },
                ],
              },
              {
                id: 'granary.tell_the_keeper',
                label: 'Let the keeper hear it from them',
                intent: 'You may owe a place the truth even when you took nothing from it. The god leans the mortal into '
                  + 'saying, out loud, what they saw in there — which does not save the store, but means the people '
                  + 'burning it know what they are burning.',
                effects: [
                  {
                    kind: 'intelligence',
                    category: 'cultural_knowledge',
                    label: 'What is actually in the store',
                    detail: 'How large the animal is, where it lies, and how much of the winter is under it.',
                    reliability: 0.9,
                    targetAgentId: '$cast:keeper',
                  },
                ],
              },
            ],
          },
          failure: {
            overview: 'It came awake between them and the door and there was no quiet left to spend. {name} went out '
              + 'through it rather than past it, and paid for the difference. The store burned that morning as it '
              + 'was always going to, and now there is a traveller on the road who bleeds when they lift the '
              + 'pack.',
            changes: [
              {
                id: 'granary.neg.failure.wound',
                kind: 'trait',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'A Wound',
                causeClause: 'The bear woke between them and the door and they went out through it',
                detail: '{actor} went out through it rather than past it, and paid for the difference.',
                stateNoun: {
                  text: 'a wound',
                  entityId: 'trait.condition.wounded',
                  visualKind: 'attachment',
                },
                concepts: [
                  {
                    text: 'a wound',
                    entityId: 'trait.condition.wounded',
                    visualKind: 'attachment',
                  },
                ],
              },
              {
                id: 'granary.neg.failure.blight',
                kind: 'trait',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'A Hungry Season',
                causeClause: 'The store burned that morning as it was always going to',
                detail: '{location} burned its own store and will be short until spring.',
                stateNoun: {
                  text: 'a hungry season',
                  entityId: '$target',
                  visualKind: 'location',
                },
                concepts: [
                  {
                    text: 'a hungry season',
                    entityId: '$target',
                    visualKind: 'location',
                  },
                  {
                    text: 'Blighted Harvest',
                    entityId: 'trait.condition.location.harvest_blight',
                    visualKind: 'attachment',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'granary.their_own_time',
                label: 'Let the settlement find it in its own time',
                intent: 'Non-interference, held to the end. The god does not clean up after the mortal and does not '
                  + 'confess for them either. The world will find out or it will not, on its own schedule, and the '
                  + 'god will be watching when it does.',
                effects: [
                  {
                    kind: 'hidden_mark',
                    category: 'concealed_action',
                    severity: 0.4,
                    label: 'Was inside the store the night before it burned',
                    targetAgentId: '$actor',
                    revealFamilies: ['investigation'],
                  },
                ],
              },
              {
                id: 'granary.tell_the_keeper',
                label: 'Let the keeper hear it from them',
                intent: 'You may owe a place the truth even when you took nothing from it. The god leans the mortal into '
                  + 'saying, out loud, what they saw in there — which does not save the store, but means the people '
                  + 'burning it know what they are burning.',
                effects: [
                  {
                    kind: 'intelligence',
                    category: 'cultural_knowledge',
                    label: 'What is actually in the store',
                    detail: 'How large the animal is, where it lies, and how much of the winter is under it.',
                    reliability: 0.9,
                    targetAgentId: '$cast:keeper',
                  },
                ],
              },
            ],
          },
          critical_failure: {
            overview: 'The animal woke to a shape in the dark and went at it. {name} got the door open and got through '
              + 'it, and left blood on the boards for {cast:keeper} to find. The store burned at noon with the '
              + 'near bar hanging off its seat, and {location} spent the season deciding who to blame for a '
              + 'winter it had already lost.',
            changes: [
              {
                id: 'granary.neg.critfail.wound',
                kind: 'trait',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'A Wound',
                causeClause: 'The animal woke to a shape in the dark and went at it',
                detail: '{actor} got the door open and got through it, and left blood on the boards.',
                stateNoun: {
                  text: 'a wound',
                  entityId: 'trait.condition.wounded',
                  visualKind: 'attachment',
                },
                concepts: [
                  {
                    text: 'a wound',
                    entityId: 'trait.condition.wounded',
                    visualKind: 'attachment',
                  },
                ],
              },
              {
                id: 'granary.neg.critfail.blight',
                kind: 'trait',
                category: 'scar',
                direction: 'loss',
                polarity: 'loss',
                title: 'A Hungry Season',
                causeClause: 'The store burned at noon with the near bar hanging off its seat',
                detail: '{location} burned its own store and will be short until spring.',
                stateNoun: {
                  text: 'a hungry season',
                  entityId: '$target',
                  visualKind: 'location',
                },
                concepts: [
                  {
                    text: 'a hungry season',
                    entityId: '$target',
                    visualKind: 'location',
                  },
                  {
                    text: 'Blighted Harvest',
                    entityId: 'trait.condition.location.harvest_blight',
                    visualKind: 'attachment',
                  },
                ],
              },
            ],
            reactions: [
              {
                id: 'granary.their_own_time',
                label: 'Let the settlement find it in its own time',
                intent: 'Non-interference, held to the end. The god does not clean up after the mortal and does not '
                  + 'confess for them either. The world will find out or it will not, on its own schedule, and the '
                  + 'god will be watching when it does.',
                effects: [
                  {
                    kind: 'hidden_mark',
                    category: 'concealed_action',
                    severity: 0.4,
                    label: 'Was inside the store the night before it burned',
                    targetAgentId: '$actor',
                    revealFamilies: ['investigation'],
                  },
                ],
              },
              {
                id: 'granary.tell_the_keeper',
                label: 'Let the keeper hear it from them',
                intent: 'You may owe a place the truth even when you took nothing from it. The god leans the mortal into '
                  + 'saying, out loud, what they saw in there — which does not save the store, but means the people '
                  + 'burning it know what they are burning.',
                effects: [
                  {
                    kind: 'intelligence',
                    category: 'cultural_knowledge',
                    label: 'What is actually in the store',
                    detail: 'How large the animal is, where it lies, and how much of the winter is under it.',
                    reliability: 0.9,
                    targetAgentId: '$cast:keeper',
                  },
                ],
              },
            ],
          },
        },
      },
    },
    fallback: {
      overview: 'The store is open again, however it went. What is left inside it is the settlement\'s to count.',
      changes: [],
      byOutcome: {
        success: {
          overview: 'The store is open again, however it went. What is left inside it is the settlement\'s to count.',
          changes: [],
          reactions: [
            {
              id: 'granary.rest_before_road',
              label: 'Let them rest before the road',
              intent: 'The wound is taken off them before they travel on.',
              effects: [
                {
                  kind: 'remove_condition',
                  conditionTraitId: 'trait.condition.wounded',
                  targetAgentId: '$actor',
                },
              ],
            },
            {
              id: 'granary.go_straight_on',
              label: 'Let them go straight on',
              intent: 'Nothing is fixed for them; they carry what they carry and keep moving.',
              effects: [
                {
                  kind: 'spawn_artifact',
                  category: 'mundane',
                  tier: 'common',
                  targetAgentId: '$actor',
                },
              ],
            },
          ],
        },
      },
    },
  },
  description: 'A bear has denned three days on a settlement\'s winter store, and the agent\'s own goods are '
    + 'locked behind the bar. Cross the dark room to reach the pack, then find out — by nature, not by '
    + 'choice — whether the mortal stays to drive the animal out and save the store, or takes what is '
    + 'theirs and leaves the settlement to burn it.',
  locationSubtypes: expandSettings(['rural', 'wayside', 'stronghold']),
  consequenceDraw: ['possession', 'membership'],
};

export const THE_BEAST_IN_THE_GRANARY_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
