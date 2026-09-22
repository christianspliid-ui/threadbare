/**
 * The Crown's Reckoning — slot 2 of the town-keeper pair (THR-1448): the Realm
 * turns to its keeper for something it would not ask a stranger.
 * 
 * Brief: `Docs/plans/encounters/town-keeper-brief.md`.
 * 
 * ─── The narrator's 12 questions, answered ───────────────────────────
 *   1 P1 arrival?      Yes, per class: the crown's marshal rides into `{location}`
 *                      (urban) or is passed through its gate (stronghold) and asks
 *                      for `{actor}` by name as its keeper. Agent and place are graph names.
 *   2 P2 events?       The border is stirring; the marshal has six riders and a week;
 *                      the men are in the fields. Costs paid, not scenery.
 *   3 P3 one stake?    Obligation with a cost either way: man the wall and then
 *                      give the crown the granary and keep its favour, or keep the
 *                      granary for the town and answer for it at court.
 *   4 ≤80 words?       Opening + spine are inside budget at both classes.
 *   5 Read aloud?      Every sentence is a report. No interior sensation anywhere.
 *   6 Stated, never encoded? The marshal's patience is stated ('until the riders
 *                      are rested'), never implied by furniture.
 *   7 Every sentence works? Each states the challenge, the test, or the outcome.
 *   8 Nothing unintroduced? The marshal, the border, the wall, the granary and the
 *                      court all appear in prose before a card or a chip names them.
 *   9 One named person? `{cast:marshal}` — the crown's marshal, on stage at both beats.
 *  10 Stake in a sentence? 'Does the keeper give the crown the town, or keep the
 *                      town from the crown?'
 *  11 Cards verb+noun, spell-style? Yes; the three specials are named imperative
 *                      verb + noun and state mechanism, no odds-talk, no digits.
 *  12 Opening per class? `urban` and `stronghold`, both written, enforced by
 *                      `validateSettingEnvelope`.
 * 
 * ─── Mechanical design block (designed before the prose) ─────────────
 *   Crux            The crown asks its keeper for the town's wall and then its
 *                   granary, and the keeper can satisfy the crown or the town.
 *   Whose problem?  The keeper's, by construction (`requiresHold`). The at-cost band
 *                   is the keeper keeping the town and losing the court's favour.
 *   Reach = theme?  Step 0 tests Iron and is *about* getting men out of the fields
 *                   and onto a wall. Step 1 tests Heart and is *about* answering a
 *                   marshal who has already seen the wall. Chosen before the scene.
 *   Shape           danger → query (the marshal's ask).
 *   Consequence hand (binding, THR-1145): `membership` + `omen`, with the ONE
 *                   recorded swap `membership` → `standing` — see `consequenceSwap`.
 *                   `omen` — `emit_omen` (cultural) on the failure side: a kept
 *                   town's granary refused to the crown with the border stirring is
 *                   what a country asks about, and the asking biases what comes.
 *   Spine           `faction_reputation_gain` on `$realm`, both directions.
 *   Cool failure?   No siege, no gaol. The marshal writes what he saw and rides;
 *                   the keeper is spent, and the court has a page on them.
 *   Systems quota   cast + conditions + reputation + factions + omens — five, two
 *                   over the contract's floor.
 * 
 * ─── The swap (recorded, THR-1145) ────────────────────────────────────
 *   `membership` fights this fiction by construction: a keeper is a member of the
 *   Realm the day the standing opens (THR-1448 mints the `member_of` edge at
 *   `2a.55`), so `join` no-ops on every mortal who can be offered this; `leave`
 *   would expel a keeper the plan rules keeps receiving the town's business while
 *   the town is held; and `rank_delta` writes the derived `rank` cache the plan
 *   forbids writing (THR-1211 — reputation is the authority). Standing is what the
 *   crown's reckoning actually moves, and it is wired both ways.
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
  id: 'encounter.realm.crowns_reckoning',
  tags: ['#crown_errand', '#town_keeper'],
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'The Crown\'s Reckoning',
  reach: 'iron',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['loyalty_ambition', 'courage_prudence'],
  requiresHold: {
    ofRealm: true,
  },
  settings: ['urban', 'stronghold'],
  openings: {
    urban: '{cast:marshal} rides into {location} with six of the crown\'s riders and asks for {actor} by '
      + 'name, as the one who keeps this town for the crown.',
    stronghold: '{cast:marshal} is passed through the gate of {location} with six of the crown\'s riders behind '
      + 'him and asks for {actor} by name, as the one who keeps this place for the crown.',
  },
  steps: [
    {
      reach: 'iron',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.35,
      purposeLine: 'Man the walls',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The crown\'s word is that the border is stirring and every kept town is to have its wall manned '
        + 'before the week is out. The men of {location} are in the fields. {cast:marshal} will count the '
        + 'wall when his riders are rested, and he has said so.',
      successAfterimage: 'The wall was manned when the marshal counted it.',
      failureAfterimage: 'The marshal counted a wall with fields\' worth of gaps in it.',
      successAtCostAfterimage: 'The wall was manned, and the fields were left half-cut to do it.',
      criticalSuccessAfterimage: 'The wall was manned before the riders had unsaddled, and the marshal said so.',
      criticalFailureAfterimage: 'The men stayed in the fields, and the marshal counted the keeper standing on the wall alone.',
      deal: {
        count: 4,
        tags: ['might', 'peril'],
      },
      nudges: [
        {
          id: 'reckoning.harden_the_muster',
          name: 'Harden The Muster',
          sphere: 'force',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.strength',
          effectLine: 'Put iron in the townsmen\'s legs so the wall fills before the marshal counts it. A real help.',
          bandProse: {
            success: 'The men came up out of the fields at a run and the wall filled.',
            failure: 'The men came up at a run and there were still not enough of them.',
          },
        },
        {
          id: 'reckoning.quiet_the_fear',
          name: 'Quiet The Fear',
          sphere: 'spirit',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.ward',
          effectLine: 'Still the town\'s fear of the border so the wall is a place to stand rather than a place to be '
            + 'seen from. A real help.',
          bandProse: {
            critical_success: 'Nobody on the wall looked at the border, and the marshal noticed that first.',
            success_at_cost: 'The men stood the wall steady, and the fields paid for the steadiness.',
            failure: 'The men were calm, and calm men in the fields do not make a wall.',
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
      purposeLine: 'Answer the marshal',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: 'The wall is what it is and {cast:marshal} has counted it. Now he asks for the rest of what the '
        + 'crown wants: the town\'s surplus, carted to the border before the frost. {actor} can give the '
        + 'crown the granary and keep its favour, or keep the granary for {location} and answer for it at '
        + 'court.',
      successAfterimage: 'The marshal rode with the crown\'s answer and the town still fed.',
      failureAfterimage: 'The marshal rode with a refusal in his saddlebag and the keeper\'s name on it.',
      successAtCostAfterimage: 'The granary went to the border and the town will eat thin for it.',
      criticalSuccessAfterimage: 'The marshal took less than the crown had asked and wrote that the keeper had given more.',
      criticalFailureAfterimage: 'The marshal wrote down the wall and the granary both, and rode without a word to the keeper.',
      successMetadata: {
        effects: [
          {
            kind: 'faction_reputation_gain',
            factionId: '$realm',
            amount: 0.08,
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
          {
            kind: 'emit_omen',
            category: 'cultural',
            intensity: 0.35,
            narrativeHook: 'A kept town\'s granary was refused to the crown with the border stirring, and the country is '
              + 'asking whose side its keepers are on.',
            scope: {
              kind: 'global',
            },
          },
        ],
      },
      deal: {
        count: 5,
        tags: ['presence', 'social'],
      },
      nudges: [
        {
          id: 'reckoning.recall_the_border',
          name: 'Turn The Marshal',
          sphere: 'time',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.memory',
          effectLine: 'Bring back to the marshal the last season this town gave and was not thanked. A real help.',
          bandProse: {
            success: 'The marshal remembered the last season\'s carts before the keeper had named them.',
            failure: 'The marshal remembered the carts and said the crown remembered them too, which was why it was '
              + 'asking.',
          },
        },
      ],
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'marshal',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['soldier', 'guard', 'official'],
      supportRole: 'crown_marshal',
      spawnNpcRole: 'soldier',
      spawnName: 'Osric Vane',
    },
  ],
  narrativeTemplates: {
    initiation: 'The crown\'s marshal is at the town the keeper holds, with riders behind him and the border '
      + 'stirring. Man the wall and answer for the granary and the court reads a keeper it can lean on. '
      + 'Fail the crown and the court reads the other thing.',
    success: 'The wall was manned and the marshal rode with the crown\'s answer. The court has a keeper it can '
      + 'lean on, and knows the name.',
    failure: 'The marshal rode with the wall and the granary both written down and the keeper\'s name over '
      + 'them. The court will lean on somebody else next season.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The marshal has ridden on. What the crown asked of its keeper, and what it got, is on the road '
        + 'to the court.',
      changes: [
        {
          id: 'reckoning.the_wall_manned',
          kind: 'growth',
          title: 'A wall, manned',
          detail: 'A week getting men out of the fields and onto a wall teaches the iron reach.',
          polarity: 'gain',
          concepts: [
            {
              text: 'iron reach',
              tooltipId: 'reach.iron',
            },
          ],
        },
      ],
      reactions: [
        {
          id: 'reckoning.stand_the_men_down',
          label: 'Stand the men down and let the keeper sleep',
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
          overview: 'The wall stood manned and the marshal rode with the crown\'s answer. The town is still fed and '
            + 'the court has a keeper it can lean on.',
          changes: [
            {
              id: 'reckoning.counted_loyal',
              kind: 'faction_reputation',
              category: 'boon',
              direction: 'gain',
              stateNoun: {
                text: 'court standing',
                entityId: '$realm',
                visualKind: 'faction',
                tooltipId: 'ui.standing',
              },
              title: 'Counted loyal',
              causeClause: 'Answered the crown\'s marshal with the wall manned',
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
          overview: 'The granary went to the border. {location} will eat thin this winter, and the court will '
            + 'remember who fed it.',
          changes: [
            {
              id: 'reckoning.fed_the_crown',
              kind: 'faction_reputation',
              category: 'boon',
              direction: 'gain',
              stateNoun: {
                text: 'court standing',
                entityId: '$realm',
                visualKind: 'faction',
                tooltipId: 'ui.standing',
              },
              title: 'Fed the crown',
              causeClause: 'Gave the crown the granary',
              detail: 'Their standing with the crown rose; the town paid.',
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
          overview: 'The wall stood half-manned and the granary stayed shut. {cast:marshal} wrote both down and rode. '
            + '{actor} is spent, and the court has a page on them.',
          changes: [
            {
              id: 'reckoning.spent_on_the_wall',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              stateNoun: {
                text: 'Exhausted',
                entityId: 'trait.condition.exhausted',
                visualKind: 'attachment',
              },
              title: 'Spent on the wall',
              causeClause: 'Held a wall and a granary against the crown\'s marshal alone',
              detail: '{actor} is exhausted.',
              polarity: 'loss',
              concepts: [
                {
                  text: 'exhausted',
                  entityId: 'trait.condition.exhausted',
                  visualKind: 'attachment',
                },
              ],
            },
            {
              id: 'reckoning.answered_for_it',
              kind: 'faction_reputation',
              category: 'scar',
              direction: 'loss',
              stateNoun: {
                text: 'court standing',
                entityId: '$realm',
                visualKind: 'faction',
                tooltipId: 'ui.standing',
              },
              title: 'Answered for it',
              causeClause: 'Refused the crown its granary',
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
          overview: '{cast:marshal} rode for the court with the keeper\'s refusal in his saddlebag and an empty wall '
            + 'behind him. The crown will send someone else to keep this town, or ask why it should not.',
          changes: [
            {
              id: 'reckoning.stood_the_wall_alone',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              stateNoun: {
                text: 'Exhausted',
                entityId: 'trait.condition.exhausted',
                visualKind: 'attachment',
              },
              title: 'Stood the wall alone',
              causeClause: 'Nobody came up out of the fields',
              detail: '{actor} is exhausted.',
              polarity: 'loss',
              concepts: [
                {
                  text: 'exhausted',
                  entityId: 'trait.condition.exhausted',
                  visualKind: 'attachment',
                },
              ],
            },
            {
              id: 'reckoning.the_keepers_refusal',
              kind: 'faction_reputation',
              category: 'scar',
              direction: 'loss',
              stateNoun: {
                text: 'court standing',
                entityId: '$realm',
                visualKind: 'faction',
                tooltipId: 'ui.standing',
              },
              title: 'The keeper\'s refusal',
              causeClause: 'Refused the crown from an empty wall',
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
  consequenceSwap: {
    from: 'membership',
    to: 'standing',
    reason: 'A keeper is a member of the Realm by construction of the hold (THR-1448 mints the member_of edge '
      + 'the day the standing opens), so join no-ops on every mortal this can be offered to; leave would '
      + 'expel a keeper the plan rules keeps receiving the town\'s business while the town is held; '
      + 'rank_delta writes the derived rank cache the plan forbids (THR-1211). Standing is what the '
      + 'crown\'s reckoning actually moves, and it is wired both ways.',
  },
  description: 'A two-step reckoning: get the men of the town the actor keeps out of the fields and onto its '
    + 'wall for the crown\'s marshal, then answer for the granary. The second town-keeper encounter — '
    + 'the Realm asking its keeper what it would not ask a stranger.',
  locationSubtypes: expandSettings(['urban', 'stronghold']),
  // The hand the id draws is [membership, omen]; the ONE recorded swap above holds
  // this template to [standing, omen], and `check:encounter` recomputes exactly that.
  consequenceDraw: ['standing', 'omen'],
};

export const CROWNS_RECKONING_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
