/**
 * The Mill Lease — slot 1 of expert-everyday-3 (THR-1680), the batch's appointment slot.
 * Two-step expert Gold job: price the abbey's water-mill lease (the abbey's books against the old
 * miller's tallies), then bid for the millers' fellowship against a richer grain merchant under the
 * abbey's letting rule. On a won bid the lease is sealed at the mill on quarter day, in three days,
 * with the cellarer there — an `encounter_seed` carrying an `appointment` block (THR-1479), so the
 * step-1 spine may name the place and time (prose rule 7b's one lawful exception). Kept →
 * `town.mill_lease_sealed` (seed-only), missed → `town.mill_lease_forfeit` (seed-only), both
 * hand-authored in `mill-lease-sequels.ts`.
 * 
 * Pipeline: `Docs/plans/encounters/mill-lease-auction-final.md` (editorial PASS WITH REVISIONS ·
 * systems READY WITH CAVEATS · package critic PASS: `mill-lease-auction-package.md`).
 * plotHookTaken: hook.succession_crisis — the old miller is gone and the mill's lease is the empty
 * seat; the fellowship and a grain merchant each make a real case, and the merchant has assembled
 * more than an argument (flour the old miller ground off the abbey's books). Seed dice: p3 choice
 * (price high and the fellowship cannot pay, low and the merchant wins) · opposition faction
 * (doctrine: the abbey's letting rule) · disposition open · agentRole client who is owed (the
 * fellowship pays the fee at the sealing) · scale region.
 * Consequence hand (binding): knowledge (trade_route intelligence) + story_seed (the appointment).
 * Card types: Cache (matter) · Signature (time) on step 0; Signature (order) · Kindled Ambition
 * (spirit) on step 1. Step 0 failure writes reputation -0.03 so the critical_failure SCAR has a
 * backing write. Narrator's 12 questions: see final file section 19 (opening 78 words).
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
  id: 'encounter.town.mill_lease_auction',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Mill Lease',
  reach: 'gold',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['asceticism_extravagance', 'honesty_cunning'],
  tags: ['#trade'],
  settings: ['rural', 'urban'],
  openings: {
    rural: '{actor} comes into {location} on market day, sent for by the millers\' fellowship.',
    urban: '{actor} arrives in {location}, sent for by the millers\' fellowship of the town.',
  },
  steps: [
    {
      reach: 'gold',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.58,
      purposeLine: 'Price the mill',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The abbey\'s water-mill is up for lease. {cast:cellarer}, the abbey\'s cellarer, takes bids for '
        + 'it today. The fellowship wants it, and so does a grain merchant with more money than the '
        + 'fellowship.\n\n'
        + 'The abbey\'s books and the old miller\'s tallies disagree on what the mill earns. If {actor} '
        + 'prices the lease too high, the fellowship cannot pay it. Too low, and the merchant wins it.',
      successAfterimage: 'They found the gap. The old miller\'s tallies showed far more grain ground than the abbey\'s '
        + 'books.',
      failureAfterimage: 'They could not make the books and the tallies agree, and had only the books to price the lease '
        + 'on.',
      successAtCostAfterimage: 'They found the gap, but only after the cellarer had opened the bids.',
      criticalSuccessAfterimage: 'By the time bids opened, they knew what the mill earns, and it was far more than the abbey\'s '
        + 'books show.',
      criticalFailureAfterimage: 'They priced the lease on the books alone, and said the figure aloud where the merchant could '
        + 'hear it.',
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
        tags: ['insight', 'labor'],
      },
      nudges: [
        {
          id: 'mill.uncover_hidden_tallies',
          name: 'Uncover Hidden Tallies',
          sphere: 'matter',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.matter',
          effectLine: 'Bring a forgotten bundle of older notched sticks down from the mill loft, so the gap can be '
            + 'checked year by year.',
          bandProse: {
            critical_success: 'A bundle of older tallies lay forgotten in the loft, and the gap ran back for years.',
            success: 'A bundle of older tallies lay in the loft, and they showed the same gap year after year.',
            near_miss: 'A bundle of older tallies lay in the loft, but mice had gnawed most of them.',
            failure: 'A bundle of older tallies lay in the loft, but nobody could say which years they counted.',
          },
        },
        {
          id: 'mill.stretch_the_morning',
          name: 'Stretch The Morning',
          sphere: 'time',
          essenceCost: 1,
          forecastDelta: 0.09,
          imageTag: 'generic.time-slow',
          effectLine: 'Make the hour of prayers run long, so the cellarer leaves the abbey\'s book open to them with '
            + 'nobody waiting.',
          bandProse: {
            success_at_cost: 'The cellarer stayed at prayers an hour past the bell, then came out wanting the book back at '
              + 'once.',
            failure: 'The cellarer stayed at prayers an hour past the bell, and they spent it on the wrong year\'s '
              + 'accounts.',
            critical_failure: 'The cellarer came out of prayers early and found them reading the abbey\'s book unasked.',
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
      difficulty: 0.66,
      purposeLine: 'Win the lease',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: '{cast:merchant} bids first, and offers a rent the fellowship cannot match. The abbey\'s rule '
        + 'lets the mill to the highest bidder who can show he has dealt honestly with the abbey, and the '
        + 'cellarer keeps the rule to the letter. Nobody will say how a merchant can bid so much for a mill '
        + 'whose books show so little. If the fellowship wins, the lease is sealed at the mill on quarter '
        + 'day, in three days, with the cellarer there. If it loses, {location} will think less of {actor}.',
      successAfterimage: 'Under the rule\'s questions, {cast:merchant} could not say where his flour came from, and the '
        + 'cellarer struck his bid.',
      failureAfterimage: '{cast:merchant} outbid the fellowship, and the cellarer let him the mill.',
      successAtCostAfterimage: 'The cellarer struck {cast:merchant}\'s bid, but only after the fellowship had raised its own '
        + 'twice.',
      criticalSuccessAfterimage: 'The fellowship\'s bid stood from the first, and the cellarer struck {cast:merchant}\'s bid when '
        + 'he could not say where his flour came from.',
      criticalFailureAfterimage: '{actor} accused {cast:merchant} of cheating the abbey and could not prove it. The cellarer let '
        + 'him the mill.',
      successMetadata: {
        effects: [
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: 0.06,
          },
          {
            kind: 'intelligence',
            category: 'trade_route',
            label: 'Where the mill\'s grain went',
            detail: 'The old miller ground grain off the abbey\'s books and sold the flour to the merchant.',
            reliability: 0.85,
            targetAgentId: '$actor',
          },
          {
            kind: 'encounter_seed',
            templateId: 'town.mill_lease_sealed',
            targetAgentId: '$actor',
            delayTicks: 36,
            inheritContext: true,
            seedLabel: 'The mill\'s lease is sealed on quarter day, with the abbey\'s cellarer there to seal it.',
            appointment: {
              locationId: '$here',
              counterpartyId: '$cast:cellarer',
              missed: {
                templateId: 'town.mill_lease_forfeit',
                seedLabel: 'The lease was not sealed on quarter day, and the cellarer comes looking for the expert who won '
                  + 'it.',
              },
            },
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
        ],
      },
      deal: {
        count: 3,
        tags: ['social', 'presence'],
      },
      nudges: [
        {
          id: 'mill.read_out_the_rule',
          name: 'Read Out The Rule',
          sphere: 'order',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.oath',
          effectLine: 'Set the cellarer reciting the abbey\'s letting law before bids close, so the clause on honest '
            + 'dealing is heard by everyone.',
          bandProse: {
            success: 'The cellarer recited the letting law before the bids, and every bidder heard the clause on '
              + 'honest dealing.',
            success_at_cost: 'The cellarer recited the letting law, and then held the fellowship to every clause of it.',
            failure: 'The cellarer recited the letting law, but {cast:merchant} swore he had always dealt honestly '
              + 'with the abbey.',
          },
        },
        {
          id: 'mill.swell_the_rivals_pride',
          name: 'Swell The Rival\'s Pride',
          sphere: 'spirit',
          essenceCost: 2,
          forecastDelta: 0.11,
          imageTag: 'generic.rumor',
          effectLine: 'Kindle the merchant\'s vanity as the bids climb, so he boasts aloud of how cheap his flour came.',
          bandProse: {
            critical_success: '{cast:merchant} boasted of how cheap his flour came before the bidding had even begun.',
            near_miss: '{cast:merchant} boasted of cheap flour, but would not say who sold it to him.',
            failure: '{cast:merchant} boasted only of his money.',
            critical_failure: '{cast:merchant} boasted of his money until the fellowship\'s men shouted him down, and the '
              + 'cellarer closed the bidding early.',
          },
        },
      ],
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'cellarer',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['monk', 'priest', 'steward'],
      supportRole: 'cellarer',
      spawnNpcRole: 'monk',
      spawnName: 'Brother Anselm',
    },
    {
      kind: 'actor',
      key: 'merchant',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['merchant', 'trader', 'broker'],
      supportRole: 'grain merchant',
      spawnNpcRole: 'merchant',
      spawnName: 'Hugh Draycott',
    },
  ],
  narrativeTemplates: {
    initiation: 'The abbey\'s water-mill in {location} is up for lease, and the millers\' fellowship has sent for '
      + 'an expert to bid for it.',
    success: 'The fellowship won the lease, and it is sealed at the mill on quarter day.',
    failure: 'The fellowship lost the lease.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The abbey\'s water-mill in {location} has been bid for, won or lost.',
      changes: [],
      reactions: [],
      byOutcome: {
        critical_success: {
          overview: 'The cellarer wrote the fellowship\'s name into the abbey\'s book with the merchant still in the '
            + 'room. {actor}\'s fee is paid when the lease is sealed.',
          changes: [
            {
              id: 'mill.crit.the_towns_regard',
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
              title: 'A lease won',
              causeClause: 'The fellowship\'s word on it',
              detail: '{location} thinks well of their work.',
            },
            {
              id: 'mill.crit.where_the_grain_went',
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
                  text: 'where the missing grain went',
                  tooltipId: 'ui.knowledge',
                },
              ],
              title: 'Where the grain went',
              causeClause: 'Sold by the old miller',
              detail: '{actor} knows where the mill\'s missing grain went.',
            },
            {
              id: 'mill.crit.quarter_day',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'gain',
              stateNoun: {
                text: 'appointment',
                entityId: '$appointment',
                visualKind: 'location',
              },
              concepts: [
                {
                  text: 'seals the lease',
                },
              ],
              title: 'The sealing',
              causeClause: 'Quarter day at the mill',
              detail: '{cast:cellarer} seals the lease in {location} in three days.',
            },
          ],
        },
        success: {
          overview: 'The abbey has the fellowship down for the mill. {actor}\'s fee is paid when the lease is sealed.',
          changes: [
            {
              id: 'mill.win.the_towns_regard',
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
              title: 'A lease won',
              causeClause: 'The fellowship\'s word on it',
              detail: '{location} thinks well of their work.',
            },
            {
              id: 'mill.win.where_the_grain_went',
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
                  text: 'where the missing grain went',
                  tooltipId: 'ui.knowledge',
                },
              ],
              title: 'Where the grain went',
              causeClause: 'Sold by the old miller',
              detail: '{actor} knows where the mill\'s missing grain went.',
            },
            {
              id: 'mill.win.quarter_day',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'gain',
              stateNoun: {
                text: 'appointment',
                entityId: '$appointment',
                visualKind: 'location',
              },
              concepts: [
                {
                  text: 'seals the lease',
                },
              ],
              title: 'The sealing',
              causeClause: 'Quarter day at the mill',
              detail: '{cast:cellarer} seals the lease in {location} in three days.',
            },
          ],
        },
        success_at_cost: {
          overview: 'The fellowship will be short of coin all year to pay its rent. {actor}\'s fee is paid when the '
            + 'lease is sealed.',
          changes: [
            {
              id: 'mill.cost.the_towns_regard',
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
              title: 'A lease won',
              causeClause: 'The fellowship\'s word on it',
              detail: '{location} thinks well of their work.',
            },
            {
              id: 'mill.cost.where_the_grain_went',
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
                  text: 'where the missing grain went',
                  tooltipId: 'ui.knowledge',
                },
              ],
              title: 'Where the grain went',
              causeClause: 'Sold by the old miller',
              detail: '{actor} knows where the mill\'s missing grain went.',
            },
            {
              id: 'mill.cost.quarter_day',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'gain',
              stateNoun: {
                text: 'appointment',
                entityId: '$appointment',
                visualKind: 'location',
              },
              concepts: [
                {
                  text: 'seals the lease',
                },
              ],
              title: 'The sealing',
              causeClause: 'Quarter day at the mill',
              detail: '{cast:cellarer} seals the lease in {location} in three days.',
            },
          ],
        },
        failure: {
          overview: 'The fellowship has no mill this year, and it sent for an expert so that would not happen.',
          changes: [
            {
              id: 'mill.lost.the_towns_regard',
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
              title: 'A lease lost',
              causeClause: 'The bid did not stand',
              detail: '{location} thinks less of their work.',
            },
          ],
        },
        critical_failure: {
          overview: 'The merchant has the mill, and {location} remembers an expert\'s mistake longer than a '
            + 'stranger\'s.',
          changes: [
            {
              id: 'mill.broke.the_towns_regard',
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
              title: 'A bid given away',
              causeClause: 'Said out of turn',
              detail: '{location} thinks less of their work.',
            },
          ],
        },
      },
    },
  },
  description: 'An expert two-step Gold job for a market town: price the abbey\'s water-mill lease by reading '
    + 'the abbey\'s books against the old miller\'s tallies, then bid for the millers\' fellowship '
    + 'against a richer grain merchant under the abbey\'s letting rule. A won bid earns the town\'s '
    + 'regard and the knowledge of where the mill\'s missing grain went, and plants an appointment to '
    + 'seal the lease at the mill on quarter day in three days (kept, the lease-sealed sequel, where '
    + 'the fellowship pays the fee; missed, the lease-forfeit sequel). A lost bid costs the town\'s '
    + 'regard.',
  locationSubtypes: expandSettings(['rural', 'urban']),
  consequenceDraw: ['knowledge', 'story_seed'],
};

export const MILL_LEASE_AUCTION_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
