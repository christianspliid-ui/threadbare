/**
 * The Drowned Man's Will (slug drowned-mans-testimony) — slot 6 of the expert-everyday-1 batch (THR-1678).
 * 
 * Brief: `Docs/plans/encounters/expert-everyday-1-brief.md`.
 * Final: `Docs/plans/encounters/drowned-mans-testimony-final.md`.
 * plotHookRolled: hook.endless_pursuit, hook.gods_fall, hook.relic_awakening
 * plotHookTaken: hook.endless_pursuit — blended with hook.relic_awakening. The dead man
 *   spent his life pulling old things out of the river, and the hunt outlived him: the
 *   court pays the reader's fee from those finds, and a reader who fails keeps looking
 *   for a will the court has stopped looking for. hook.gods_fall dropped (region scale;
 *   this slot is company scale).
 * 
 * ─── The narrator's 12 questions, answered ───────────────────────────
 *   1 P1 arrival?      Yes, per class: `{actor}` arrives at the magistrate's court in
 *                      `{location}` (urban) or at `{location}` where the magistrate sits
 *                      in the tithe hall (rural). Graph names.
 *   2 P2 events?       A river trader drowned; he told the almshouse he had made a will;
 *                      none has been found; his only kin claims everything. Costs paid.
 *   3 P3 one stake?    Mystery, as rolled (the missing will), with the stake stated
 *                      plainly: a wrong reading in court costs `{actor}` their good name
 *                      in `{location}`. The agent is a bystander pulled in: sent for.
 *   4 ≤80 words?       Opening + spine within budget on both classes (gate counter).
 *   5 Read aloud?      Report throughout. No interior sensation.
 *   6 Stated, never encoded? The will, the claimant's scorn and the cost of a wrong
 *                      reading are all plain sentences.
 *   7 Every sentence works? Challenge, test, or outcome.
 *   8 Nothing unintroduced? The dead man, the almshouse, the will, the heir and the
 *                      court all appear before a card or chip names them.
 *   9 One named person? `{cast:heir}`. The magistrate is a role noun.
 *  10 Stake in a sentence? 'Can they read what the drowned man wanted, in court, before
 *                      his only kin takes the lot?'
 *  11 Cards verb+noun, spell-style? Yes; two specials, no word shared between a name
 *                      and its effect line, no digits, no odds-talk.
 *  12 Opening per class? `urban` and `rural`, both written.
 * 
 * ─── Mechanical design block (designed before the prose) ─────────────
 *   Crux            A magistrate has sent for {actor} to ask a drowned man in a dream
 *                   who he left his estate to, and his only kin wants all of it.
 *   Title           The Drowned Man's Will — the objective is the title.
 *   Whose problem?  The agent's: sent for because they are the best reader in the
 *                   district; their good name rides on the reading.
 *   Reach = theme?  One step, Veil 0.64 (`steep`): divination performed in public.
 *   Shape           Single Test with the query_prize face (the batch's 1-step slot).
 *   Rolled dice     p3 mystery · opposition rival_agent (greed: the heir) · disposition
 *                   hostile (calls the rite a trick) · role bystander pulled in · scale
 *                   company.
 *   intrinsicTier   'shaping', not 'background' — the brief's in-lane decision: the
 *                   0.45 open-draw cap binds background only, and the forecast window
 *                   selects mortals who hold the reach.
 *   The truth       The will is under a board beneath the stern seat of his boat. It
 *                   leaves the house to the heir and the savings to the almshouse.
 *                   Revealed only in the success-side bands.
 *   Consequence hand (binding, THR-1145): `thread` + `drive` — no swap.
 *                   thread — `thread_strengthen` ($ascendant ↔ $actor) on the success
 *                   half, `thread_weaken` on the failure half.
 *                   drive — `assign_ambition` ambition_uncover_secrets on the success
 *                   half (paid in a river find, they want to know what old things
 *                   know): PATH · ambition. `plant_compulsion` explore 0.5 for 72 ticks
 *                   on the failure half (they keep searching for the will): SCAR ·
 *                   compulsion.
 *   Query prize     Step `rewardPool` on the success half,
 *                   `{ categoryWeights: { possession: 1 }, tagFilters: ['#relic'] }`
 *                   → `{ kind: 'item_template', tags: ['#relic'] }`: the fee from the
 *                   dead man's river finds is TAG-DRAWN; the prose never names it, and
 *                   the engine renders the drawn item as the PRIZE chip.
 *   Standing        `reputation_with` `$here`: +0.06 / −0.06. Expert failure is
 *                   reputation before money. No person-reputation chip (THR-1685).
 *   Cool failure?   Nobody is hurt, held or branded. The heir takes the estate, the
 *                   almshouse is left out, and the town trusts the reader less.
 *   Systems quota   cast + rewards + reputation — three, the floor.
 *   Trait hooks     Gate: none. Variant: none. Trait-only nudge: none. Trait fragment:
 *                   none — no live trait fits dream-reading better than the reach.
 *   Mortal choice?  None — this is a test.
 *   Specials        `Loosen The Rival's Tongue` (Stumble, chaos, opposes the heir) and
 *                   `Call Up The Dead` (Bargain, entropy, zero essence, paid on the doom
 *                   clock — the batch's cost-channel card; one channel). No rider, no
 *                   Boost special: the deal supplies both.
 *   Prose rule 7b   The only forward state is the compulsion; its chip says only that
 *                   for a while they put the search first, which the bias performs.
 * 
 * ─── Critic loop (independent, 2026-09-30) ──────────────────────────
 *   Editorial PASS WITH REVISIONS · systems READY WITH CAVEATS · package: see
 *   drowned-mans-testimony-package.md. Post-systems fix: the heir is never gendered
 *   in player text ('his nephew' → 'his only kin' / {cast:heir}).
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
  id: 'encounter.town.drowned_mans_testimony',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Drowned Man\'s Will',
  reach: 'veil',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['tradition_novelty', 'honesty_cunning'],
  settings: ['urban', 'rural'],
  openings: {
    urban: '{actor} arrives at the magistrate\'s court in {location} for a hearing.',
    rural: '{actor} arrives at {location}, where the magistrate sits in the tithe hall.',
  },
  steps: [
    {
      reach: 'veil',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.64,
      purposeLine: 'Ask the dead man',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: 'A river trader drowned last week. He told the almshouse he had made a will, but none has been '
        + 'found. His only kin, {cast:heir}, claims the whole estate and calls dream-reading a trick. The '
        + 'magistrate has sent for {actor}, the best dream reader in the district, to ask the dead man what '
        + 'he wanted. A wrong reading in court will cost {actor} their good name in {location}.',
      criticalSuccessAfterimage: 'They said the will was under the stern seat of his boat, and the bailiff found it there within '
        + 'the hour.',
      successAfterimage: 'They read the dream as the dead man lifting a board in his boat, and the will was under it.',
      successAtCostAfterimage: 'They named a room in his house first, then his boat, and the second answer was the right one.',
      failureAfterimage: 'They read the dream as the dead man leaving everything to {cast:heir}.',
      criticalFailureAfterimage: 'They told the court the dead man had never made a will at all.',
      successMetadata: {
        rewardPool: {
          categoryWeights: {
            possession: 1,
          },
          tagFilters: ['#relic'],
        },
        effects: [
          {
            kind: 'thread_strengthen',
            ascendantId: '$ascendant',
            mortalId: '$actor',
            reason: 'Read a drowned man\'s will true with the god close',
          },
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: 0.06,
          },
          {
            kind: 'assign_ambition',
            templateId: 'ambition_uncover_secrets',
            priority: 'secondary',
            targetAgentId: '$actor',
            narrativeHook: 'Paid in one of a drowned man\'s river finds, they want to learn what other old finds can tell.',
          },
        ],
      },
      failureMetadata: {
        effects: [
          {
            kind: 'thread_weaken',
            ascendantId: '$ascendant',
            mortalId: '$actor',
            reason: 'Misread a drowned man\'s will with the god watching',
          },
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
            durationTicks: 72,
            narrativeHook: 'The court has stopped looking for the drowned man\'s will. They have not.',
          },
        ],
      },
      deal: {
        count: 4,
        tags: ['insight', 'presence'],
      },
      nudges: [
        {
          id: 'testimony.loosen_the_rivals_tongue',
          name: 'Loosen The Rival\'s Tongue',
          sphere: 'chaos',
          essenceCost: 2,
          forecastDelta: 0.13,
          opposes: 'heir',
          imageTag: 'generic.luck',
          effectLine: 'Make an opponent say more than they planned, so their own answers work against them.',
          bandProse: {
            critical_success: '{cast:heir} let slip that the dead man had spoken of a will.',
            success: '{cast:heir} gave two different answers about the dead man\'s boat, and the magistrate noticed.',
            failure: '{cast:heir} stumbled over an answer, and the court put it down to grief.',
          },
        },
        {
          id: 'testimony.call_up_the_dead',
          name: 'Call Up The Dead',
          sphere: 'entropy',
          essenceCost: 0,
          forecastDelta: 0.14,
          costs: {
            doomDelta: 1,
          },
          imageTag: 'generic.decay',
          effectLine: 'Pull a departed soul back to answer plainly for one night. Doom draws a little nearer.',
          bandProse: {
            success_at_cost: 'The dead man came when called, but talked of old quarrels before the will.',
            near_miss: 'The dead man came, and showed the boat only as the dream was ending.',
            failure: 'The dead man came, but said only the name {cast:heir}, over and over.',
            critical_failure: 'The dead man came, and the reader took his silence for an answer.',
          },
        },
      ],
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'heir',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      supportRole: 'claimant_heir',
      spawnNpcRole: 'trader',
      spawnName: 'Corvin Aldmere',
    },
  ],
  narrativeTemplates: {
    initiation: 'A magistrate has sent for a dream reader to ask a drowned man who he left his estate to, and his '
      + 'only kin claims all of it.',
    success: 'The reading was right. The will was found, and the court paid the reader\'s fee.',
    failure: 'The reading was wrong. {cast:heir} took the whole estate, and the town trusts the reader less.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The hearing is over. The court has ruled on the drowned man\'s estate.',
      changes: [
        {
          id: 'testimony.a_reading_on_the_record',
          kind: 'growth',
          title: 'A reading on the record',
          detail: 'Reading a dead man\'s dream before a magistrate teaches the veil reach.',
          polarity: 'gain',
          concepts: [
            {
              text: 'veil reach',
              tooltipId: 'reach.veil',
            },
          ],
        },
      ],
      reactions: [],
      byOutcome: {
        critical_success: {
          overview: 'The will was read in court before noon. It leaves {cast:heir} the house and the almshouse the '
            + 'savings. The magistrate thanked {actor} before the whole court and paid the fee from the dead '
            + 'man\'s river finds.',
          changes: [
            {
              id: 'testimony.crit.town_trust',
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
              title: 'Right before the magistrate',
              detail: '{location} holds their readings in higher regard.',
              concepts: [
                {
                  text: 'higher regard',
                  tooltipId: 'ui.standing',
                },
              ],
            },
            {
              id: 'testimony.crit.thread',
              kind: 'growth',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'thread',
                tooltipId: 'ui.thread',
              },
              title: 'Close in the dream',
              causeClause: 'Read the dream with the god close',
              detail: 'The thread to {actor} runs stronger.',
              concepts: [
                {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
              ],
            },
            {
              id: 'testimony.crit.ambition',
              kind: 'growth',
              category: 'path',
              direction: 'opens',
              polarity: 'gain',
              stateNoun: {
                text: 'ambition',
                tooltipId: 'ui.ambition',
              },
              title: 'What old things know',
              causeClause: 'Curious about old finds',
              detail: '{actor} is pursuing Uncover Ancient Secrets now.',
              concepts: [
                {
                  text: 'Uncover Ancient Secrets',
                  tooltipId: 'ui.ambition',
                },
              ],
            },
          ],
        },
        success: {
          overview: 'The magistrate read the will aloud. It splits the estate between {cast:heir} and the almshouse. '
            + 'The court paid the reader\'s fee from the dead man\'s river finds.',
          changes: [
            {
              id: 'testimony.success.town_trust',
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
              title: 'A reader the court trusts',
              detail: '{location} holds their readings in higher regard.',
              concepts: [
                {
                  text: 'higher regard',
                  tooltipId: 'ui.standing',
                },
              ],
            },
            {
              id: 'testimony.success.thread',
              kind: 'growth',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'thread',
                tooltipId: 'ui.thread',
              },
              title: 'Close in the dream',
              causeClause: 'Read the dream with the god close',
              detail: 'The thread to {actor} runs stronger.',
              concepts: [
                {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
              ],
            },
            {
              id: 'testimony.success.ambition',
              kind: 'growth',
              category: 'path',
              direction: 'opens',
              polarity: 'gain',
              stateNoun: {
                text: 'ambition',
                tooltipId: 'ui.ambition',
              },
              title: 'What old things know',
              causeClause: 'Curious about old finds',
              detail: '{actor} is pursuing Uncover Ancient Secrets now.',
              concepts: [
                {
                  text: 'Uncover Ancient Secrets',
                  tooltipId: 'ui.ambition',
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview: '{cast:heir} called the second answer luck in front of the whole court. The will was found all '
            + 'the same, and the almshouse gets its share. The court paid the fee from the dead man\'s river '
            + 'finds.',
          changes: [
            {
              id: 'testimony.cost.town_trust',
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
              title: 'Right in the end',
              detail: '{location} holds their readings in higher regard.',
              concepts: [
                {
                  text: 'higher regard',
                  tooltipId: 'ui.standing',
                },
              ],
            },
            {
              id: 'testimony.cost.thread',
              kind: 'growth',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'thread',
                tooltipId: 'ui.thread',
              },
              title: 'Close in the dream',
              causeClause: 'Read the dream with the god close',
              detail: 'The thread to {actor} runs stronger.',
              concepts: [
                {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
              ],
            },
            {
              id: 'testimony.cost.ambition',
              kind: 'growth',
              category: 'path',
              direction: 'opens',
              polarity: 'gain',
              stateNoun: {
                text: 'ambition',
                tooltipId: 'ui.ambition',
              },
              title: 'What old things know',
              causeClause: 'Curious about old finds',
              detail: '{actor} is pursuing Uncover Ancient Secrets now.',
              concepts: [
                {
                  text: 'Uncover Ancient Secrets',
                  tooltipId: 'ui.ambition',
                },
              ],
            },
          ],
        },
        failure: {
          overview: 'The magistrate ruled for {cast:heir}, who takes the whole estate. The almshouse is left out, and '
            + 'the will is still missing.',
          changes: [
            {
              id: 'testimony.fail.thread',
              kind: 'growth',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'thread',
                tooltipId: 'ui.thread',
              },
              title: 'Watched, and not helped',
              causeClause: 'Misread the dream with the god watching',
              detail: 'The thread to {actor} runs thinner.',
              concepts: [
                {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
              ],
            },
            {
              id: 'testimony.fail.compulsion',
              kind: 'shell_state',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'compulsion',
                tooltipId: 'ui.compulsion',
              },
              title: 'Still searching',
              detail: 'For a while they put the search for the will before other work.',
              concepts: [
                {
                  text: 'search for the will',
                  tooltipId: 'ui.compulsion',
                },
              ],
            },
            {
              id: 'testimony.fail.town_trust',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'reputation with {location}',
                entityId: '$here',
                visualKind: 'location',
                tooltipId: 'ui.reputation_with',
              },
              title: 'Wrong before the magistrate',
              detail: '{location} doubts their readings now.',
              concepts: [
                {
                  text: 'doubts their readings',
                  tooltipId: 'ui.standing',
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview: 'The magistrate ruled for {cast:heir} and closed the case. By evening all of {location} had heard '
            + 'the reading, and the almshouse was calling it a lie.',
          changes: [
            {
              id: 'testimony.critfail.thread',
              kind: 'growth',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'thread',
                tooltipId: 'ui.thread',
              },
              title: 'Watched, and not helped',
              causeClause: 'Misled the court with the god watching',
              detail: 'The thread to {actor} runs thinner.',
              concepts: [
                {
                  text: 'thread',
                  tooltipId: 'ui.thread',
                },
              ],
            },
            {
              id: 'testimony.critfail.compulsion',
              kind: 'shell_state',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'compulsion',
                tooltipId: 'ui.compulsion',
              },
              title: 'Still searching',
              detail: 'For a while they put the search for the will before other work.',
              concepts: [
                {
                  text: 'search for the will',
                  tooltipId: 'ui.compulsion',
                },
              ],
            },
            {
              id: 'testimony.critfail.town_trust',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'reputation with {location}',
                entityId: '$here',
                visualKind: 'location',
                tooltipId: 'ui.reputation_with',
              },
              title: 'Nobody\'s reader',
              detail: '{location} doubts their readings now.',
              concepts: [
                {
                  text: 'doubts their readings',
                  tooltipId: 'ui.standing',
                },
              ],
            },
          ],
        },
      },
    },
  },
  description: 'A one-step Veil test for an expert in a town or village: a magistrate sends for the best dream '
    + 'reader in the district to ask a drowned man who he left his estate to, while his only kin claims '
    + 'all of it and calls the rite a trick. The fee is drawn by query from the #relic item family; a '
    + 'true reading also gives the reader a new ambition, and a wrong one costs their standing in the '
    + 'settlement and leaves them searching for the missing will for a while.',
  locationSubtypes: expandSettings(['urban', 'rural']),
  consequenceDraw: ['thread', 'drive'],
};

export const DROWNED_MANS_TESTIMONY_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
