/**
 * The Salt Monopoly — slot 2 of the master-everyday-2 batch (THR-1757).
 * 
 * Brief: `Docs/plans/encounters/master-everyday-2-brief.md` (slot 2, binding).
 * Pipeline: salt-monopoly-draft / -revised (self-edit against the 35 editorial triggers) / package.
 * Model package: cathedral-loan (gold, master batch 1) — structure only.
 * 
 * plotHookRolled: hook.underground_city, hook.artifact_recovery, hook.deck_reading_gone_wrong
 * plotHookTaken:  hook.artifact_recovery — recovering an instrument of power for the town: the
 *                 licence and its seal case. The other two fight an everyday chancery bid.
 * 
 * Rolled constraints (brief, binding): reach gold · steps gold 0.74 -> gold 0.80 · settings urban
 * (rolled sacred, overridden: the chancery in the cathedral close) · shape seeded sequel ·
 * consequence hand possession + story_seed · p3Shape opportunity · opposition law (duty) ·
 * disposition wary · agentRole the_target · scale company · rarityTier 2 · scale local ·
 * intrinsicTier shaping.
 * 
 * ─── Mechanical design block (designed before the prose) ─────────────
 *   Crux            The duke's chancery is selling the region's salt licence for ten years, and
 *                   {actor} must win it for the town against a rival town's salt house.
 *   Whose problem?  The agent's: sent by name by the town council, which will blame them if the
 *                   salt goes to the rival. Scene-local; no prior tie asserted (prose rule 7).
 *   Reach = theme?  Step 0 Gold 0.74 reads the room and builds the purse from the backers.
 *                   Step 1 Gold 0.80 closes at the clerk's table above the sealed reserve.
 *   Shape           Seeded Sequel on a Test & Consequence spine, linear. Step 0
 *                   continue_weakened (a step-0 critical_failure ends the action); step 1
 *                   fail_action with carryover lines keyed on step 0.
 *   Consequence hand (binding, THR-1145): possession + story_seed — no swap.
 *     possession    step 1 successMetadata attachment_grant
 *                   reward_tools_instruments_gate_seal_case on $actor: the licence-holder's
 *                   wax, chalk and customs stamp. An existing possession template; no new
 *                   item id. BOON item chip on cs / s / sac. The pledge: the sac reaction
 *                   'Take the debt on yourself' grants agreement.debt.minor, counterparty
 *                   $cast:clerk.
 *     story_seed    step 1 successMetadata encounter_seed templateId
 *                   encounter.town.mill_lease_auction (exists, drawable, gold, urban+rural),
 *                   placeless, delay 72, inheritContext. The rival factor's cast key is
 *                   `merchant`, the key the mill lease binds its rival bidder to, so the
 *                   inherited binding seats the same factor at the next bidding table.
 *                   PATH chip on cs / s / sac, anchored through the carrier ($actor).
 *   Extras          reputation_with $here +0.08 (step 1 success) / -0.10 (step 1 failure) /
 *                   -0.05 (step 0 failure: backs the critical_failure page on the step-0 route).
 *   Cool failure?   Nobody is hurt, jailed or branded. A master's failure costs the name before
 *                   the purse: the town's regard for their word on money.
 *   Trait hooks     Gate: none. Variant: Monopolist (trait.reputation.monopolist) +0.04.
 *                   Trait-only nudge: none. Trait fragment: none.
 *   Systems quota   cast + rewards + seeds + reputation — four.
 *   Heavy Hand      none. Specials: Rouse The Backers (spirit), Cloud The Tally (chaos,
 *                   opposes merchant), Weigh The Coin True (order), Stretch The Hour (time).
 *                   No card.boost.core special, no rider special, no compulsion.
 * 
 * ─── The narrator's 12 questions, answered ───────────────────────────
 *   1 P1 arrival?      {actor} arrives at the duke's chancery in the cathedral close of
 *                      {location}, sent by the town council.
 *   2 P2 events?       The duke sells the licence; bids today; the rival house's factor is here.
 *   3 P3 one stake?    Opportunity: build a purse big enough before the bids are called.
 *   4 ≤80 words?       Opening + step-0 spine: 75.
 *   5 Read aloud?      Every sentence is a report.
 *   6 Stated?          The reserve, the rule of the seal and the blame are stated.
 *   7 Every sentence works? Challenge, test or outcome.
 *   8 Nothing unintroduced? Licence, chancery, rival house, factor, backers, purse before any
 *                      card; the clerk and the reserve in step 1's spine before its cards.
 *   9 One named person? Step 0 {cast:merchant}; step 1 {cast:clerk}.
 *  10 Stake in a sentence? 'Outbid the rival salt house, above the duke's reserve, before the
 *                      clerk seals the licence.'
 *  11 Cards verb+noun? Yes; no name word repeated in its effect line; no digits.
 *  12 Opening per class? urban, the only class, written.
 * 
 * ─── Known caveats ───────────────────────────────────────────────────
 *   Critic pass (cold, 2026-10-14): the seal case is now handed over in step 1's success-side
 *   afterimages (cs / s / sac / near-miss), so the BOON chip names an object the prose gave the
 *   mortal: the town holds the licence, {actor} holds its gate seal case. The rival factor's
 *   spawnName is male-coded (Edric Varne) because the seed target's prose writes he/his for its
 *   {cast:merchant}; the inherited binding seats this factor in that slot.
 *   A step-0 critical_failure ends the action, so that route carries only step 0's write
 *   (town -0.05), which backs its one chip. successMetadata fires on near_miss too, so a
 *   near-miss close still seals the licence. Live proof needs pinned bands at master difficulty.
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
  id: 'encounter.town.salt_monopoly',
  stakes: {
    goal: 'win the duke\'s salt licence for the town',
    risk: 'see the town\'s purse fall short before the council',
    won: 'won the duke\'s salt licence for the town',
    lost: 'lost the salt licence to the rival town',
    lostBadly: 'saw the town\'s purse fall short before the council',
  },
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Salt Monopoly',
  reach: 'gold',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['loyalty_ambition', 'asceticism_extravagance'],
  settings: ['urban'],
  openings: {
    urban: '{actor} arrives at the duke\'s chancery in the cathedral close of {location}, sent by the town '
      + 'council.',
  },
  steps: [
    {
      reach: 'gold',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.74,
      purposeLine: 'Build the town\'s purse',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The duke is selling the salt licence for ten years, and bids are taken today. A rival town\'s '
        + 'salt house has sent {cast:merchant}, its factor, with a heavy purse.\n\n'
        + 'The council\'s backers will pledge only what they think can win. {actor} has to read the room '
        + 'and build a purse big enough before the bids are called.',
      criticalSuccessAfterimage: 'The backers saw the room clearly, and pledged more than the council had asked.',
      successAfterimage: 'The backers pledged enough to bid against the rival house.',
      nearMissAfterimage: 'The backers pledged less than the council had asked, but enough to bid.',
      successAtCostAfterimage: 'The backers pledged enough, but the rival factor saw exactly how much.',
      failureAfterimage: 'The backers held back, and the town\'s purse came up thin.',
      criticalFailureAfterimage: 'The backers walked out, and the rival factor heard how little the town had.',
      deal: {
        count: 4,
        tags: ['social', 'insight'],
      },
      failureMetadata: {
        effects: [
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: -0.05,
          },
        ],
      },
      nudges: [
        {
          id: 'salt.rouse_the_backers',
          name: 'Rouse The Backers',
          sphere: 'spirit',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.crowd',
          effectLine: 'Fill the council\'s moneyed men with civic pride. They pledge more of their own silver to the '
            + 'purse.',
          bandProse: {
            critical_success: 'Each of them tried to give more than the last, for the town\'s name.',
            success: 'Some gave more than they had meant to, for the town\'s name.',
            near_miss: 'They grew proud of the town, but gave little more than before.',
            failure: 'They talked proudly of the town, and kept their silver in their purses.',
          },
        },
        {
          id: 'salt.cloud_the_tally',
          name: 'Cloud The Tally',
          sphere: 'chaos',
          essenceCost: 1,
          forecastDelta: 0.08,
          opposes: 'merchant',
          imageTag: 'generic.luck',
          effectLine: 'Tangle the rival factor\'s reckoning of their own coin. They show the room a smaller purse than '
            + 'the one they hold.',
          bandProse: {
            success: '{cast:merchant} counted the rival purse twice, and named a sum short of what it held.',
            success_at_cost: '{cast:merchant} lost the count for a while, and found it again before the bids were called.',
            failure: '{cast:merchant} lost the count once, found the error, and named the full purse anyway.',
            critical_failure: '{cast:merchant} found the error aloud, and the room learned how rich the rival house was.',
          },
        },
      ],
    },
    {
      reach: 'gold',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.8,
      purposeLine: 'Close at the table',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: '{cast:clerk}, the chancery clerk, holds the duke\'s sealed reserve, the lowest price the duke '
        + 'will take. The clerk will seal the licence to the best bid at or above it, and to nobody '
        + 'else.\n\n'
        + '{actor} has to close above both the reserve and the rival\'s bid. If the salt goes to the rival '
        + 'town, the council will blame the one it sent.',
      criticalSuccessAfterimage: 'The town\'s bid cleared the reserve and the rival\'s by a wide margin. The clerk sealed the '
        + 'licence at once, and gave {actor} the seal case that stamps the town\'s salt at the gates.',
      successAfterimage: 'The town\'s bid beat the rival\'s, and the clerk sealed the licence to the town. {actor} took '
        + 'the seal case that stamps the town\'s salt at the gates.',
      nearMissAfterimage: 'The town\'s bid cleared the reserve by a few coins. The clerk sealed the licence to the town, '
        + 'and gave {actor} its seal case.',
      successAtCostAfterimage: 'The town\'s bid cleared the reserve only with part of the price left owing to the chancery. The '
        + 'clerk sealed the licence and handed {actor} its seal case.',
      failureAfterimage: 'The rival\'s bid stood highest, and the clerk sealed the licence to the rival town.',
      criticalFailureAfterimage: 'The town\'s bid fell under the duke\'s reserve, and the clerk sealed the licence to the rival at '
        + 'once.',
      carryoverFactorLines: {
        critical_success: {
          text: 'The council\'s backers pledged more than was asked.',
          polarity: 'for',
          forecastDelta: 0.06,
        },
        success: {
          text: 'The town\'s purse is big enough to bid.',
          polarity: 'for',
          forecastDelta: 0.04,
        },
        success_at_cost: {
          text: 'The rival factor knows what the town has pledged.',
          polarity: 'against',
          forecastDelta: -0.02,
        },
        near_miss: {
          text: 'The backers pledged less than was asked.',
          polarity: 'against',
          forecastDelta: -0.03,
        },
        failure: {
          text: 'The town\'s purse is thin.',
          polarity: 'against',
          forecastDelta: -0.04,
        },
      },
      deal: {
        count: 4,
        tags: ['social', 'presence'],
      },
      successMetadata: {
        effects: [
          {
            kind: 'attachment_grant',
            templateId: 'reward_tools_instruments_gate_seal_case',
            targetAgentId: '$actor',
          },
          {
            kind: 'encounter_seed',
            templateId: 'encounter.town.mill_lease_auction',
            targetAgentId: '$actor',
            delayTicks: 72,
            inheritContext: true,
            seedLabel: 'The salt house that lost the licence sends its factor to bid against {actor} at the next lease.',
          },
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: 0.08,
          },
        ],
      },
      failureMetadata: {
        effects: [
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: -0.1,
          },
        ],
      },
      nudges: [
        {
          id: 'salt.weigh_the_coin_true',
          name: 'Weigh The Coin True',
          sphere: 'order',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.focus',
          effectLine: 'Make every piece in the town\'s purse ring full on the clerk\'s scales. None of it is set aside '
            + 'as clipped or light.',
          bandProse: {
            critical_success: 'Every piece rang full on the scales, and the clerk counted the town\'s purse at its whole worth.',
            success: 'None of the town\'s silver was set aside, and the purse counted whole.',
            near_miss: 'The silver rang full, but the clerk still set a few worn pieces aside.',
            failure: 'The town\'s silver counted whole, and the rival\'s purse still counted more.',
            critical_failure: 'The silver counted whole, and was still not enough.',
          },
        },
        {
          id: 'salt.stretch_the_hour',
          name: 'Stretch The Hour',
          sphere: 'time',
          essenceCost: 1,
          forecastDelta: 0.08,
          imageTag: 'generic.memory',
          effectLine: 'Hold back the chancery bell while the last bids are read. The clerk hears every offer before the '
            + 'seal is set.',
          bandProse: {
            success: 'The bell rang late, and the clerk heard the town\'s last offer before the seal was set.',
            success_at_cost: 'The bell rang late, and the rival used the time to raise as well.',
            failure: 'The bell rang late, and the extra time served the rival\'s purse better than the town\'s.',
          },
        },
      ],
    },
  ],
  traitVariants: [
    {
      traitId: 'trait.reputation.monopolist',
      forecastDelta: 0.04,
      factorLine: 'Being a Monopolist, they know how a cornered trade is priced.',
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'merchant',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['merchant', 'trader', 'broker'],
      supportRole: 'rival salt house factor',
      spawnNpcRole: 'merchant',
      spawnName: 'Edric Varne',
    },
    {
      kind: 'actor',
      key: 'clerk',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['clerk', 'scribe', 'steward'],
      supportRole: 'chancery clerk',
      spawnNpcRole: 'clerk',
      spawnName: 'Matthias Penrose',
    },
  ],
  narrativeTemplates: {
    initiation: 'The duke\'s chancery is selling the region\'s salt licence for ten years. {actor} has been sent '
      + 'by the town council to win it.',
    success: '{actor} won the duke\'s salt licence for the town.',
    failure: 'The salt licence went to a rival town, and {actor} could not stop it.',
  },
  aftermathConfig: {
    branchOnStep: 1,
    variants: {},
    fallback: {
      overview: '{actor} left the chancery once the clerk had sealed the licence.',
      changes: [],
      byOutcome: {
        critical_success: {
          overview: 'The salt of the whole region is the town\'s for ten years. The council read the duke\'s licence '
            + 'aloud in the square, with {actor}\'s name beside the town\'s.',
          changes: [
            {
              id: 'salt.cs.seal_case',
              kind: 'item',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'Gate Seal Case',
              causeClause: 'Handed over with the licence',
              detail: '{actor} holds the stamp for the town\'s licensed salt.',
              stateNoun: {
                text: 'Gate Seal Case',
                entityId: 'reward_tools_instruments_gate_seal_case',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'the stamp',
                  entityId: 'reward_tools_instruments_gate_seal_case',
                  visualKind: 'attachment',
                },
              ],
            },
            {
              id: 'salt.cs.town',
              kind: 'reputation',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Town\'s Regard',
              detail: '{location} trusts {actor} with its trade.',
              stateNoun: {
                text: 'reputation with {location}',
                entityId: '$here',
                visualKind: 'location',
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
              id: 'salt.cs.next_lease',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
              title: 'The Next Lease',
              causeClause: 'Outbid at the chancery',
              detail: '{cast:merchant} will bid against {actor} for the next lease.',
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
                {
                  text: '{cast:merchant}',
                  entityId: '$cast:merchant',
                  visualKind: 'agent',
                },
              ],
            },
          ],
          reactions: [
            {
              id: 'salt.cs.share_the_carting',
              label: 'Offer the losing house the carting',
              intent: 'Give the rival house the work of carting the town\'s salt. The factor is warmer toward the '
                + 'mortal for it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:merchant',
                  sentimentDelta: 0.1,
                  trustDelta: 0.06,
                },
              ],
            },
            {
              id: 'salt.cs.keep_the_carts',
              label: 'Keep every cart for the town',
              intent: 'The town\'s own carters keep the work. The town\'s regard rises, and the factor takes against '
                + 'the mortal.',
              effects: [
                {
                  kind: 'reputation_with',
                  targetLocationId: '$here',
                  delta: 0.04,
                },
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:merchant',
                  sentimentDelta: -0.08,
                },
              ],
            },
          ],
        },
        success: {
          overview: 'The salt of the region is the town\'s for ten years, and the council knows who won it.',
          changes: [
            {
              id: 'salt.s.seal_case',
              kind: 'item',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'Gate Seal Case',
              causeClause: 'Handed over with the licence',
              detail: '{actor} holds the stamp for the town\'s licensed salt.',
              stateNoun: {
                text: 'Gate Seal Case',
                entityId: 'reward_tools_instruments_gate_seal_case',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'the stamp',
                  entityId: 'reward_tools_instruments_gate_seal_case',
                  visualKind: 'attachment',
                },
              ],
            },
            {
              id: 'salt.s.town',
              kind: 'reputation',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Town\'s Regard',
              detail: '{location} trusts {actor} with its trade.',
              stateNoun: {
                text: 'reputation with {location}',
                entityId: '$here',
                visualKind: 'location',
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
              id: 'salt.s.next_lease',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
              title: 'The Next Lease',
              causeClause: 'Outbid at the chancery',
              detail: '{cast:merchant} will bid against {actor} for the next lease.',
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
                {
                  text: '{cast:merchant}',
                  entityId: '$cast:merchant',
                  visualKind: 'agent',
                },
              ],
            },
          ],
          reactions: [
            {
              id: 'salt.s.share_the_carting',
              label: 'Offer the losing house the carting',
              intent: 'Give the rival house the work of carting the town\'s salt. The factor is warmer toward the '
                + 'mortal for it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:merchant',
                  sentimentDelta: 0.1,
                  trustDelta: 0.06,
                },
              ],
            },
            {
              id: 'salt.s.keep_the_carts',
              label: 'Keep every cart for the town',
              intent: 'The town\'s own carters keep the work. The town\'s regard rises, and the factor takes against '
                + 'the mortal.',
              effects: [
                {
                  kind: 'reputation_with',
                  targetLocationId: '$here',
                  delta: 0.04,
                },
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:merchant',
                  sentimentDelta: -0.08,
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview: 'The licence is the town\'s, but part of the price is still owed to the chancery, and someone '
            + 'must stand for it.',
          changes: [
            {
              id: 'salt.sac.seal_case',
              kind: 'item',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'Gate Seal Case',
              causeClause: 'Handed over with the licence',
              detail: '{actor} holds the stamp for the town\'s licensed salt.',
              stateNoun: {
                text: 'Gate Seal Case',
                entityId: 'reward_tools_instruments_gate_seal_case',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'the stamp',
                  entityId: 'reward_tools_instruments_gate_seal_case',
                  visualKind: 'attachment',
                },
              ],
            },
            {
              id: 'salt.sac.town',
              kind: 'reputation',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Town\'s Regard',
              detail: '{location} trusts {actor} with its trade.',
              stateNoun: {
                text: 'reputation with {location}',
                entityId: '$here',
                visualKind: 'location',
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
              id: 'salt.sac.next_lease',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'info',
              title: 'The Next Lease',
              causeClause: 'Outbid at the chancery',
              detail: '{cast:merchant} will bid against {actor} for the next lease.',
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
                {
                  text: '{cast:merchant}',
                  entityId: '$cast:merchant',
                  visualKind: 'agent',
                },
              ],
            },
          ],
          reactions: [
            {
              id: 'salt.sac.take_the_debt',
              label: 'Carry the town\'s debt',
              intent: 'The mortal owes the chancery what the town could not pay. The town\'s regard rises for it.',
              effects: [
                {
                  kind: 'attachment_grant',
                  templateId: 'agreement.debt.minor',
                  targetAgentId: '$actor',
                  counterpartyId: '$cast:clerk',
                },
                {
                  kind: 'reputation_with',
                  targetLocationId: '$here',
                  delta: 0.04,
                },
              ],
            },
            {
              id: 'salt.sac.leave_the_debt',
              label: 'Leave the debt with the council',
              intent: 'The council pays the rest itself. None of it falls on the mortal, and the town\'s regard falls.',
              effects: [
                {
                  kind: 'reputation_with',
                  targetLocationId: '$here',
                  delta: -0.04,
                },
              ],
            },
          ],
        },
        failure: {
          overview: 'The council sent {actor} by name to win the salt, and the salt has gone to the rival town for '
            + 'ten years.',
          changes: [
            {
              id: 'salt.f.town',
              kind: 'reputation',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'The Town\'s Regard',
              causeClause: 'Every backer heard',
              detail: '{location} thinks less of {actor}\'s word on money.',
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
            },
          ],
        },
        critical_failure: {
          overview: 'The salt has gone to the rival town for ten years, and the whole council saw the town\'s purse '
            + 'fall short. {actor} was the one it sent.',
          changes: [
            {
              id: 'salt.cf.town',
              kind: 'reputation',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'The Town\'s Regard',
              detail: '{location} thinks less of {actor}\'s word on money.',
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
            },
          ],
        },
      },
    },
  },
  description: 'The duke\'s chancery is selling the licence to the region\'s salt for ten years, and a rival '
    + 'town\'s salt house has come with a heavy purse. The licence goes to the best bid above the '
    + 'duke\'s sealed reserve.',
  locationSubtypes: expandSettings(['urban']),
  consequenceDraw: ['possession', 'story_seed'],
};

export const SALT_MONOPOLY_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
