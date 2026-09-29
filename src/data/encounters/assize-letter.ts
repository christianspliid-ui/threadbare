/**
 * The Assize Letter — slot 3 of the journeyman-everyday-1 batch (THR-1676).
 * 
 * Brief: `Docs/plans/encounters/journeyman-everyday-1-brief.md`.
 * Draft: `Docs/plans/encounters/assize-letter-draft.md`.
 * plotHookTaken: hook.heresy_hunt (rolled: hook.death_and_return, hook.heresy_hunt,
 *   hook.shifting_shape). An authority has named a miller a heretic; the parish
 *   priest swears otherwise, and the sworn word has to reach the court in time.
 * 
 * ─── The narrator's 12 questions, answered ───────────────────────────
 *   1 P1 arrival?      Yes, per class: `{actor}` stops in `{location}` for the night
 *                      (rural), or is in `{location}` when the clerk comes looking
 *                      (urban). Agent and place are graph names.
 *   2 P2 events?       The assize sits in two days; a miller of the parish stands
 *                      before it on a heresy charge; the letter is the priest's sworn
 *                      word for him. Events, stated.
 *   3 P3 one stake?    Plea, as the brief rolled: the clerk cannot leave the rolls
 *                      and asks the agent to judge the road and carry the letter.
 *   4 ≤80 words?       Opening + spine inside budget at both classes.
 *   5 Read aloud?      Report throughout. No interior sensation.
 *   6 Stated, never encoded? The cost of a late letter is stated: the court rules
 *                      without it and the mill and its six jobs are lost.
 *   7 Every sentence works? Challenge, test, or outcome.
 *   8 Nothing unintroduced? The clerk, the letter, the assize, the miller and the
 *                      deadline all appear before a card or a chip names them.
 *   9 One named person? `{cast:clerk}` — the assize clerk, on stage at the one beat.
 *  10 Stake in a sentence? 'Does the priest's letter reach the court before the
 *                      miller's case is heard?'
 *  11 Cards verb+noun, spell-style? Yes; two specials, effect lines state what the
 *                      god does, no digits, no odds-talk, no word shared with the name.
 *  12 Opening per class? `rural` and `urban`, both written.
 * 
 * ─── Mechanical design block (designed before the prose) ─────────────
 *   Crux            A sealed letter has to reach the assize before the session
 *                   sits, and the clerk holding it asks the agent to pick the road
 *                   and carry it.
 *   Title           The Assize Letter — the object and the errand, nothing more.
 *   Whose problem?  The agent's by request: the judge asked to rule (rolled role).
 *                   The road they pick is theirs, and so is the walk.
 *   Reach = theme?  One step, Star 0.45 (`fair`), *about* reading a long road right
 *                   the first time: distance, weather, the ford, the night sky.
 *   Shape           single test (packet roll, kept).
 *   Seed dice       p3 plea · opposition law (duty — the court sits at its hour
 *                   and rules on what is in front of it) · disposition neutral (the
 *                   clerk wants the letter there and has no stake in who carries it)
 *                   · role judge asked to rule · scale company (the miller, his mill
 *                   and six workers).
 *   Consequence hand (binding, THR-1145): `knowledge` + `story_seed`, recorded
 *                   swap `story_seed` → `movement` (see `consequenceSwap`).
 *                   `knowledge` — `intelligence` (political_secret) on the success
 *                   side: the letter is read in open court, and whoever carried it
 *                   hears who laid the charge and why.
 *                   `movement` — `agent_relocation` (travel, away ≥3 hexes) on the
 *                   success side: taking the letter is leaving. On the failure side
 *                   the agent turned back, so nothing relocates them.
 *   Spine           `bond_change` with `$cast:clerk`, both directions: the clerk
 *                   trusts a carrier who got it there, and less one who did not.
 *   Cool failure?   Nobody is jailed or hurt. The letter is late, the mill is
 *                   forfeit, and the clerk's trust drops: money, standing, time.
 *   Trait hooks     Gate: none. Variant: none. Trait-only nudge: none. Trait
 *                   fragment: none. No live trait fits road-reading better than the
 *                   reach itself; no hook is the written answer.
 *   Mortal choice?  None — this is a test.
 *   Systems quota   cast + rewards (bond_change) + reputation — three, the floor.
 *                   Knowledge and movement back chips but do not score the quota.
 *   Prose rule 7b   The prose never names where the agent goes after the court;
 *                   the relocation picks a place at least three hexes off, and the
 *                   chip says only that they are on the road away from here.
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
  id: 'encounter.town.assize_letter',
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'The Assize Letter',
  reach: 'star',
  consequenceSwap: {
    from: 'story_seed',
    to: 'movement',
    reason: 'The miller\'s case is decided at the assize, off-scene and at the court\'s own hour — there is '
      + 'no later scene this one can honestly plant for the carrier, whose part ends when the letter is '
      + 'read. What this scene can change is where the mortal is: taking the letter is leaving, so the '
      + 'consequence is the road away from here.',
  },
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['sacrifice_survival', 'loyalty_ambition'],
  settings: ['rural', 'urban'],
  openings: {
    rural: '{actor} stops in {location} for the night, and {cast:clerk} of the assize finds them.',
    urban: '{actor} is in {location} when {cast:clerk} of the assize comes looking for a carrier.',
  },
  steps: [
    {
      reach: 'star',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.45,
      purposeLine: 'Judge the road',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: 'A miller stands before the assize in two days, charged with heresy. The priest\'s sealed letter '
        + 'swears for him. If the letter comes late, the court rules without it, and the mill and its six '
        + 'jobs are lost. The ridge road is long, walked by night; the valley road is short, across a ford. '
        + 'The clerk asks {actor} to judge the road and carry it.',
      criticalSuccessAfterimage: 'They read the road right in the dark and never once lost it.',
      successAfterimage: 'They judged the road well and walked on through the night.',
      successAtCostAfterimage: 'The road ran longer than they had judged, and they made up the hours by not stopping.',
      failureAfterimage: 'They judged the valley road the faster and found the ford running too high to cross.',
      criticalFailureAfterimage: 'They lost a day on the wrong road before they knew it.',
      successMetadata: {
        effects: [
          {
            kind: 'intelligence',
            category: 'political_secret',
            label: 'Who laid the heresy charge',
            detail: 'The priest\'s letter, read in open court, names the miller\'s accuser: the neighbour who offered '
              + 'for the mill last year.',
            reliability: 0.8,
            targetAgentId: '$actor',
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
          {
            kind: 'bond_change',
            withAgentId: '$cast:clerk',
            sentimentDelta: 0.15,
            trustDelta: 0.1,
          },
        ],
      },
      failureMetadata: {
        effects: [
          {
            kind: 'bond_change',
            withAgentId: '$cast:clerk',
            sentimentDelta: -0.1,
            trustDelta: -0.1,
          },
        ],
      },
      deal: {
        count: 4,
        tags: ['journey', 'lore'],
      },
      nudges: [
        {
          id: 'assize.draw_down_the_river',
          name: 'Draw Down The River',
          sphere: 'matter',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.matter',
          effectLine: 'Pull the water off the crossing overnight, so a ford that ran deep runs shallow. A real help.',
          bandProse: {
            critical_success: 'The river dropped in the night, and the short road was open to them after all.',
            success: 'The river fell by dawn, so whichever road they took, the water did not stop them.',
            near_miss: 'The river fell, but slowly, and they waited on the bank for the last of it.',
            failure: 'The river was falling when they reached the ford, but not fast enough.',
          },
        },
        {
          id: 'assize.lengthen_the_day',
          name: 'Stretch The Day',
          sphere: 'time',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.time-slow',
          effectLine: 'Hold the evening light past its hour, so more road is walked before dark. A real help.',
          bandProse: {
            success_at_cost: 'The evening held its light past the hour, and they were over the worst of the road before dark.',
            failure: 'The light held late into the evening, and the court sat at its hour all the same.',
            critical_failure: 'The long evening only gave them more light to go wrong by.',
          },
        },
      ],
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'clerk',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['clerk'],
      supportRole: 'assize_clerk',
      spawnNpcRole: 'clerk',
      spawnName: 'Wenna Loy',
    },
  ],
  narrativeTemplates: {
    initiation: 'A sealed letter swearing for a miller charged with heresy has to reach the assize in two days, '
      + 'and the clerk who holds it needs a carrier.',
    success: 'The priest\'s letter reached the court in time and was read before the miller\'s case.',
    failure: 'The priest\'s letter did not reach the court before the miller\'s case was heard. The mill is '
      + 'forfeit.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The assize has sat. The court heard the miller\'s case with the priest\'s letter on the table, '
        + 'or without it.',
      changes: [
        {
          id: 'assize.a_road_judged',
          kind: 'growth',
          title: 'A road, judged',
          detail: 'A night spent reading a long road teaches the star reach.',
          polarity: 'gain',
          concepts: [
            {
              text: 'star reach',
              tooltipId: 'reach.star',
            },
          ],
        },
      ],
      reactions: [],
      byOutcome: {
        critical_success: {
          overview: 'The letter was on the court\'s table a night early. The priest\'s oath was read, the charge did '
            + 'not stand, and the mill stays the miller\'s. Six workers keep their wages.',
          changes: [
            {
              id: 'assize.clerk_trusts',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'Trusted with the rolls',
              causeClause: 'Proved a sure carrier',
              detail: '{cast:clerk} trusts them with the assize\'s business now.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:clerk',
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
            {
              id: 'assize.knows_the_accuser',
              kind: 'shell_state',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'Heard in open court',
              causeClause: 'Stayed for the hearing',
              detail: '{actor} knows who laid the heresy charge, and why.',
              stateNoun: {
                text: 'knowledge',
                tooltipId: 'ui.knowledge',
              },
              concepts: [
                {
                  text: 'who laid the heresy charge',
                  tooltipId: 'ui.knowledge',
                },
              ],
            },
            {
              id: 'assize.on_the_road',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'gain',
              title: 'On the road',
              causeClause: 'Left with the letter',
              detail: '{actor} is travelling away from {location} now.',
              stateNoun: {
                text: 'seed',
                tooltipId: 'ui.aftermath_seed',
              },
              concepts: [
                {
                  text: 'travelling away',
                },
              ],
            },
          ],
        },
        success: {
          overview: 'The letter was read into the record before the miller\'s case was called. The court heard the '
            + 'priest\'s oath and let the mill stay his.',
          changes: [
            {
              id: 'assize.clerk_trusts',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'Trusted with the rolls',
              causeClause: 'Proved a sure carrier',
              detail: '{cast:clerk} trusts them with the assize\'s business now.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:clerk',
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
            {
              id: 'assize.knows_the_accuser',
              kind: 'shell_state',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'Heard in open court',
              causeClause: 'Stayed for the hearing',
              detail: '{actor} knows who laid the heresy charge, and why.',
              stateNoun: {
                text: 'knowledge',
                tooltipId: 'ui.knowledge',
              },
              concepts: [
                {
                  text: 'who laid the heresy charge',
                  tooltipId: 'ui.knowledge',
                },
              ],
            },
            {
              id: 'assize.on_the_road',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'gain',
              title: 'On the road',
              causeClause: 'Left with the letter',
              detail: '{actor} is travelling away from {location} now.',
              stateNoun: {
                text: 'seed',
                tooltipId: 'ui.aftermath_seed',
              },
              concepts: [
                {
                  text: 'travelling away',
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview: 'The letter reached the table as the miller\'s case was called, and it was read in time. The mill '
            + 'stays his. {actor} has not slept since setting out.',
          changes: [
            {
              id: 'assize.clerk_trusts',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'Trusted with the rolls',
              causeClause: 'Proved a sure carrier',
              detail: '{cast:clerk} trusts them with the assize\'s business now.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:clerk',
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
            {
              id: 'assize.knows_the_accuser',
              kind: 'shell_state',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'Heard in open court',
              causeClause: 'Stayed for the hearing',
              detail: '{actor} knows who laid the heresy charge, and why.',
              stateNoun: {
                text: 'knowledge',
                tooltipId: 'ui.knowledge',
              },
              concepts: [
                {
                  text: 'who laid the heresy charge',
                  tooltipId: 'ui.knowledge',
                },
              ],
            },
            {
              id: 'assize.on_the_road',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'gain',
              title: 'On the road',
              causeClause: 'Left with the letter',
              detail: '{actor} is travelling away from {location} now.',
              stateNoun: {
                text: 'seed',
                tooltipId: 'ui.aftermath_seed',
              },
              concepts: [
                {
                  text: 'travelling away',
                },
              ],
            },
          ],
        },
        failure: {
          overview: 'The letter went back to {cast:clerk} and reached the court by carter, a day after the case was '
            + 'heard. The mill is forfeit.',
          changes: [
            {
              id: 'assize.clerk_doubts',
              kind: 'reputation',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Turned back',
              causeClause: 'Misjudged the ford',
              detail: '{cast:clerk} trusts them less with the assize\'s business.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:clerk',
                visualKind: 'agent',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'trusts them less',
                  tooltipId: 'ui.standing',
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview: 'The letter never reached the court. The miller was found guilty without it, the mill is forfeit, '
            + 'and six workers are out of wages.',
          changes: [
            {
              id: 'assize.clerk_done',
              kind: 'reputation',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Trusted far less',
              causeClause: 'Took the wrong road',
              detail: '{cast:clerk} trusts them far less than before.',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:clerk',
                visualKind: 'agent',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'trusts them far less',
                  tooltipId: 'ui.standing',
                },
              ],
            },
          ],
        },
      },
    },
  },
  description: 'A one-step Star test for a journeyman: judge the road to the assize and carry a sealed letter '
    + 'that a miller\'s heresy case turns on. Success sends the carrier onward knowing who laid the '
    + 'charge and trusted by the clerk; failure leaves the letter late, the mill forfeit and the '
    + 'clerk\'s trust lower.',
  locationSubtypes: expandSettings(['rural', 'urban']),
  consequenceDraw: ['knowledge', 'movement'],
};

export const ASSIZE_LETTER_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
