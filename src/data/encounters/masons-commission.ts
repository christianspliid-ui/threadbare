/**
 * The Mason's Commission — slot 6 of journeyman-everyday-1 (THR-1676). Drafted as the
 * batch's appointment floor; that floor moved to the next batch, because appointment
 * branches must resolve to seed-only (`drawable: false`) templates authored for them
 * (THR-1526) and none exist yet. Now a plain seeded sequel.
 * 
 * Brief: `Docs/plans/encounters/journeyman-everyday-1-brief.md`.
 * plotHookTaken: hook.environmental_gauntlet — the ground itself is the threat (old
 * rubble fill under the site that nobody warned about); the rival mason is the
 * secondary problem. No magic: the rolled `uncanny` opposition reads as the town's
 * own forgotten ground (brief § Overrides, slot 6).
 * 
 * ─── The narrator's 12 questions, answered ───────────────────────────
 *   1 P1 arrival?      Yes, per class: `{actor}` arrives in `{location}` on the
 *                      morning the town lets the arcade (urban) or the village
 *                      lets the bridge (rural). Graph names only.
 *   2 P2 events?       The old pier has cracked and nobody may pass under it; a
 *                      rival has already bid lower. Costs already paid, no scenery.
 *   3 P3 one stake?    Opportunity: one commission, a season's pay, let today to
 *                      whichever mason reads the ground right.
 *   4 ≤80 words?       Opening + spine: 71 (urban) / 71 (rural).
 *   5 Read aloud?      Every sentence is a report; no interior sensation.
 *   6 Stated, never encoded? The fill is stated ('old rubble fill that nobody had
 *                      warned of'), never implied by a cracked flagstone.
 *   7 Every sentence works? Each is the challenge, the test, or the outcome.
 *   8 Nothing unintroduced? The pier, the inspector, the rival, the trial pit and
 *                      the noon load all appear before a card or chip names them.
 *   9 One named person? Step 0: `{cast:inspector}`. Step 1: `{cast:rival}`.
 *  10 Stake in a sentence? 'Does the mason read the ground well enough to win the
 *                      town's commission from a cheaper rival?'
 *  11 Cards verb+noun, spell-style? Yes; four specials, mechanism-stating, no
 *                      digits, no name word repeated in the effect line.
 *  12 Opening per class? `urban` and `rural`, both written.
 * 
 * ─── Mechanical design block (designed before the prose) ─────────────
 *   Crux            A public work is let to one of two masons before the inspector;
 *                   the ground under it is worse than anyone said.
 *   Whose problem?  The agent's: they came to bid, and the commission is theirs
 *                   or the rival's by noon (agentRole: competitor).
 *   Reach = theme?  Step 0 tests Stone and is *about* reading ground (the trial
 *                   pit). Step 1 tests Stone and is *about* building on it (the
 *                   trial footing under load). Difficulties 0.40 → 0.45 (brief, amended: open-draw ceiling).
 *   Shape           Seeded sequel (was: appointment). One placeless `encounter_seed`
 *                   by query `#build` on step 1's success side (`inheritContext`,
 *                   96 ticks): when the town lets its next work, its works office
 *                   sends for the mason — the other party finds them. No place-and-
 *                   time promise anywhere (prose rule 7b / REVISE 34). The dropped
 *                   appointment (kept `#build` / missed `#tavern_night`) resolved to
 *                   drawable board templates, which THR-1526 forbids.
 *   Consequence hand (binding, THR-1145): `relationship` + `possession` — no swap.
 *                   `relationship` — `bond_change` with `$cast:inspector` on step 1,
 *                   both directions: the inspector who let the pier trusts the mason
 *                   whose trial footing held, and trusts one whose footing settled less.
 *                   Chipped on every band (`reputation with {target}` on the inspector).
 *                   `possession` — step 1 `successMetadata.rewardPool`
 *                   (`#tool`): the first part of the fee, paid from the town's
 *                   store. The sequel's own reward lives in the sequel;
 *                   this encounter pays on the letting (note for the critic).
 *                   Extra: `apply_condition` `trait.condition.location.festival`
 *                   on `$here`, success side: the winning mason's shoring lets the
 *                   town back under the pier by nightfall, and it holds the fair
 *                   it had put off (set up in step 0's spine). A fact about the town.
 *   Spine           `reputation_with` on `$here`, both directions (chip noun `reputation with {location}`, since `{target}` is the actor on a self-targeted scene) — journeyman
 *                   stakes are standing, and the town is the party that judges.
 *   Cool failure?   Nobody is hurt or jailed. The rival gets the work, the fee
 *                   goes with it, and the town thinks less of the losing mason.
 *   Trait hooks     Gate: none (everyday by construction). Variant: none — no
 *                   live trait fits reading ground better than the reach does.
 *                   Trait-only nudge: none. Trait fragment: none.
 *   Systems quota   cast + rewards + seeds + conditions + reputation — five.
 *   Heavy Hand      none authored (batch allowance left for other slots).
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
  id: 'encounter.town.masons_commission',
  stakes: {
    goal: 'win the pier commission with a trial footing',
    risk: 'see their footing break while the whole town watches',
    won: 'won the pier commission with a footing that held',
    lost: 'watched their footing settle and lost the work',
    lostBadly: 'broke their footing into the fill before the town',
  },
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'The Mason\'s Commission',
  reach: 'stone',
  crudType: 'create',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['loyalty_ambition', 'preservation_transformation'],
  settings: ['urban', 'rural'],
  openings: {
    urban: '{actor} arrives in {location} on the morning its market arcade is shut for repair.',
    rural: '{actor} comes into {location} on the morning its bridge is shut for repair.',
  },
  steps: [
    {
      reach: 'stone',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.4,
      purposeLine: 'Read the ground',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'An old pier has cracked from top to bottom. Nobody may go near it, so the fair has been put off. '
        + '{cast:inspector}, the inspector of works, will let the rebuilding to one mason today. A rival '
        + 'mason has already bid lower. Each must dig a trial pit and say what the ground will carry. The '
        + 'work pays a season\'s wages and wins {location}\'s regard.',
      successAfterimage: 'They dug past the topsoil into loose fill and said plainly it would not carry a pier.',
      failureAfterimage: 'They called the ground sound and dug no deeper than the topsoil.',
      successAtCostAfterimage: 'They found the fill, but the pit caved in first and the morning went to digging it out.',
      criticalSuccessAfterimage: 'They found the fill, how deep it ran, and the line of the old wall it came from.',
      criticalFailureAfterimage: 'They called the ground sound in front of the inspector, and the rival heard them say it.',
      deal: {
        count: 4,
        tags: ['craft', 'insight'],
      },
      nudges: [
        {
          id: 'commission.stir_the_memory',
          name: 'Stir The Memory',
          sphere: 'mind',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.memory',
          effectLine: 'Bring what once stood on this site back to the inspector\'s mind, so it is said aloud while they '
            + 'dig. A real help.',
          bandProse: {
            success: 'The inspector remembered an old chapel on this ground and said so while the pits were open.',
            failure: 'The inspector remembered an old chapel on this ground, but only after the pits were filled in.',
          },
        },
        {
          id: 'commission.loosen_the_spoil',
          name: 'Loosen The Spoil',
          sphere: 'matter',
          essenceCost: 1,
          forecastDelta: 0.1,
          imageTag: 'generic.matter',
          effectLine: 'Soften the topsoil in their pit, so the spade reaches the layer beneath it early. A small help.',
          bandProse: {
            critical_success: 'The spade went through the topsoil in a few cuts and struck rubble while the rival was still '
              + 'digging.',
            failure: 'The digging went fast and stopped at the first hard layer, which was not the bottom.',
          },
        },
      ],
    },
    {
      reach: 'stone',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.45,
      purposeLine: 'Set the footing',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: 'By mid-morning both masons know what lies a spade down: the rubble of a building long gone, and '
        + 'nobody had warned of it. {cast:rival} says a wide footing will ride on it. Each mason sets a '
        + 'trial footing in their pit. At noon the inspector loads both with stone, and the footing that '
        + 'holds wins the commission.',
      successAfterimage: 'Their footing held under the stone, and the inspector let them the work.',
      failureAfterimage: 'Their footing settled under the load, and the inspector let the work to the rival.',
      successAtCostAfterimage: 'Their footing held, but only on a bed of good stone they bought with their own money.',
      criticalSuccessAfterimage: 'Their footing took the whole load without a crack, and the rival\'s sank a hand into the fill.',
      criticalFailureAfterimage: 'Their footing broke into the fill under the load, and the whole town saw it go.',
      successMetadata: {
        rewardPool: {
          categoryWeights: {
            possession: 1,
          },
          tagFilters: ['#tool'],
        },
        effects: [
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: 0.06,
          },
          {
            kind: 'bond_change',
            withAgentId: '$cast:inspector',
            sentimentDelta: 0.12,
            trustDelta: 0.1,
          },
          {
            kind: 'apply_condition',
            conditionTraitId: 'trait.condition.location.festival',
            targetLocationId: '$here',
            intensity: 0.5,
            durationTicks: 36,
          },
          {
            kind: 'encounter_seed',
            query: {
              kind: 'encounter_template',
              tags: ['#build'],
            },
            targetAgentId: '$actor',
            delayTicks: 96,
            seedLabel: 'When the town lets its next work, its works office sends for the mason whose footing held.',
            inheritContext: true,
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
          {
            kind: 'bond_change',
            withAgentId: '$cast:inspector',
            sentimentDelta: -0.08,
            trustDelta: -0.1,
          },
        ],
      },
      deal: {
        count: 3,
        tags: ['craft', 'labor'],
      },
      nudges: [
        {
          id: 'commission.harden_the_bed',
          name: 'Harden The Bed',
          sphere: 'force',
          essenceCost: 2,
          forecastDelta: 0.13,
          imageTag: 'generic.strength',
          effectLine: 'Pack the rubble under their footing tight, so the load bears on solid ground. A real help.',
          bandProse: {
            success: 'The rubble under their footing sat tight and did not shift when the stone went on.',
            failure: 'The rubble under their footing held, and the stones they had set on it did not.',
          },
        },
        {
          id: 'commission.hasten_the_rival',
          name: 'Hasten The Rival',
          sphere: 'chaos',
          essenceCost: 2,
          forecastDelta: 0.11,
          imageTag: 'generic.luck',
          effectLine: 'Rush the other mason\'s hands, so their footing goes down before the mortar has set. A real '
            + 'help.',
          bandProse: {
            success: 'The rival finished first, and their mortar was still wet at noon.',
            success_at_cost: 'The rival\'s mortar was wet at noon, and the inspector had both footings loaded twice.',
            failure: 'The rival worked fast, and their footing held anyway.',
          },
        },
      ],
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'inspector',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['clerk', 'elder', 'steward'],
      supportRole: 'inspector_of_works',
      spawnNpcRole: 'clerk',
      spawnName: 'Aldo Venner',
    },
    {
      kind: 'actor',
      key: 'rival',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['mason'],
      supportRole: 'rival_mason',
      spawnNpcRole: 'mason',
      spawnName: 'Brisa Holt',
    },
  ],
  narrativeTemplates: {
    initiation: 'A cracked pier is to be rebuilt, and the inspector of works lets it today to one of two masons. '
      + 'The ground under it is worse than anyone said.',
    success: 'The commission was let to the mason whose footing held, and the works office will know their '
      + 'name when the next work is let.',
    failure: 'The commission went to the rival mason, and the fee went with it.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The inspector has let the pier to one of two masons.',
      changes: [
        {
          id: 'commission.the_ground_read',
          kind: 'growth',
          title: 'A trial pit, dug',
          detail: 'A morning reading bad ground teaches the stone reach.',
          polarity: 'gain',
          concepts: [
            {
              text: 'stone reach',
              tooltipId: 'reach.stone',
            },
          ],
        },
      ],
      reactions: [],
      byOutcome: {
        critical_success: {
          overview: '{cast:inspector} let the pier to {actor} in front of {location}, while the rival\'s footing was '
            + 'still sinking into the fill. The town paid the first part of the fee in kind.',
          changes: [
            {
              id: 'commission.crit.the_towns_regard',
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
              title: 'Read the ground right',
              causeClause: 'Read the ground right',
              detail: '{location} thinks well of their work.',
            },
            {
              id: 'commission.crit.feast_day',
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
                  text: 'fair',
                  entityId: 'trait.condition.location.festival',
                  visualKind: 'attachment',
                },
              ],
              title: 'A fair day',
              causeClause: 'The pier was shored by nightfall',
              detail: '{location} holds the fair it had put off.',
            },
            {
              id: 'commission.crit.sent_for',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'gain',
              stateNoun: {
                text: 'seed',
                tooltipId: 'ui.aftermath_seed',
              },
              title: 'Sent for by the works',
              causeClause: 'Known for footings that hold',
              detail: 'The works office will send for {actor} again.',
              concepts: [
                {
                  text: '{actor}',
                  entityId: '$actor',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'commission.crit.inspector_trusts',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Inspector\'s Trust',
              causeClause: 'The trial footing held',
              detail: '{cast:inspector} trusts {actor}\'s footings now.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:inspector',
                visualKind: 'agent',
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
        success: {
          overview: 'The inspector let the pier to {actor}. {cast:rival} took the refusal badly and left the site. '
            + 'The town paid the first part of the fee in kind.',
          changes: [
            {
              id: 'commission.win.the_towns_regard',
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
              title: 'Won the commission',
              causeClause: 'Their footing held',
              detail: '{location} thinks well of their work.',
            },
            {
              id: 'commission.win.feast_day',
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
                  text: 'fair',
                  entityId: 'trait.condition.location.festival',
                  visualKind: 'attachment',
                },
              ],
              title: 'A fair day',
              causeClause: 'The pier was shored by nightfall',
              detail: '{location} holds the fair it had put off.',
            },
            {
              id: 'commission.win.sent_for',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'gain',
              stateNoun: {
                text: 'seed',
                tooltipId: 'ui.aftermath_seed',
              },
              title: 'Sent for again',
              causeClause: 'Won the town\'s work once',
              detail: 'The works office will send for {actor} again.',
              concepts: [
                {
                  text: '{actor}',
                  entityId: '$actor',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'commission.win.inspector_trusts',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Inspector\'s Trust',
              causeClause: 'The trial footing held',
              detail: '{cast:inspector} trusts {actor}\'s footings now.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:inspector',
                visualKind: 'agent',
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
        success_at_cost: {
          overview: 'The inspector let the pier to {actor}, but the footing that won it stood on stone they paid for '
            + 'themselves. The town paid the first part of the fee in kind, and they start the work out of '
            + 'pocket.',
          changes: [
            {
              id: 'commission.cost.the_towns_regard',
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
              title: 'Won it the dear way',
              causeClause: 'Won the commission',
              detail: '{location} thinks well of their work.',
            },
            {
              id: 'commission.cost.feast_day',
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
                  text: 'fair',
                  entityId: 'trait.condition.location.festival',
                  visualKind: 'attachment',
                },
              ],
              title: 'A fair day',
              causeClause: 'The pier was shored by nightfall',
              detail: '{location} holds the fair it had put off.',
            },
            {
              id: 'commission.cost.sent_for',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'gain',
              stateNoun: {
                text: 'seed',
                tooltipId: 'ui.aftermath_seed',
              },
              title: 'Sent for again',
              causeClause: 'Their footing won the letting',
              detail: 'The works office will send for {actor} again.',
              concepts: [
                {
                  text: '{actor}',
                  entityId: '$actor',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'commission.cost.inspector_trusts',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Inspector\'s Trust',
              causeClause: 'The trial footing held',
              detail: '{cast:inspector} trusts {actor}\'s footings now.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:inspector',
                visualKind: 'agent',
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
        failure: {
          overview: 'The inspector let the pier to {cast:rival}. {actor} leaves the site with no fee and a trial '
            + 'footing that settled while the town watched.',
          changes: [
            {
              id: 'commission.lost.the_towns_regard',
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
              title: 'Lost the commission',
              causeClause: 'Outbuilt by a cheaper mason',
              detail: '{location} thinks less of their work.',
            },
            {
              id: 'commission.lost.inspector_doubts',
              kind: 'reputation',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'The Inspector\'s Doubt',
              causeClause: 'The trial footing settled',
              detail: '{cast:inspector} trusts {actor}\'s footings less now.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:inspector',
                visualKind: 'agent',
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
          overview: 'The trial footing broke into the fill in front of {location}. The inspector let the pier to '
            + '{cast:rival} and told the town why.',
          changes: [
            {
              id: 'commission.broke.the_towns_regard',
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
              title: 'Broke under the load',
              causeClause: 'Built on ground they had not read',
              detail: '{location} thinks less of their work.',
            },
            {
              id: 'commission.broke.inspector_doubts',
              kind: 'reputation',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'The Inspector\'s Doubt',
              causeClause: 'The footing broke under load',
              detail: '{cast:inspector} will not trust {actor}\'s footings again.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:inspector',
                visualKind: 'agent',
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
  description: 'A two-step stone contest for a town commission: read the ground in a trial pit, then set a trial '
    + 'footing the inspector loads at noon. The winner is let the work, wins the town\'s and the '
    + 'inspector\'s regard, and the works office sends for them when it lets its next work (a placeless '
    + 'seeded sequel by family query).',
  locationSubtypes: expandSettings(['urban', 'rural']),
  consequenceDraw: ['relationship', 'possession'],
};

export const MASONS_COMMISSION_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
