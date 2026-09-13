/**
 * The Tithe Demanded — slot 3 of the realm-court batch (THR-1454).
 * 
 * Brief: `Docs/plans/encounters/realm-court-brief.md`.
 * 
 * ─── The narrator's 12 questions, answered ───────────────────────────
 *   1 P1 arrival?      Yes, per class: `{actor}` is in `{location}` when the
 *                      crown's collector arrives with a cart and a ledger (rural),
 *                      or sets up in the square with one (urban).
 *   2 P2 events?       The crown takes a due each year; the collector has come for
 *                      this one; the ledger says the town paid a third more last
 *                      year than anyone remembers paying.
 *   3 P3 one stake?    Mystery, as the brief declared: nobody can say where the
 *                      difference went, the collector will not leave short, and the
 *                      agent is the one in front of the ledger.
 *   4 ≤80 words?       Opening + spine inside budget at both classes.
 *   5 Read aloud?      Report throughout.
 *   6 Stated, never encoded? The discrepancy is stated as a number of records, not
 *                      implied by a nervous clerk.
 *   7 Every sentence works? Challenge, test, or outcome.
 *   8 Nothing unintroduced? The ledger, the cart, the collector and the shortfall
 *                      all appear before a card or a chip names them.
 *   9 One named person? `{cast:collector}` — the crown's collector, both beats.
 *  10 Stake in a sentence? 'Is the ledger wrong, or is the town short — and who
 *                      carries it either way?'
 *  11 Cards verb+noun, spell-style? Yes; three specials, mechanism-stating.
 *  12 Opening per class? `rural` and `urban`, both written.
 * 
 * ─── Mechanical design block (designed before the prose) ─────────────
 *   Crux            The crown's ledger says this town owes more than it remembers
 *                   owing, and the agent is the one standing in front of it.
 *   Whose problem?  The agent's. They are the one the collector is looking at, and
 *                   a due the town cannot meet is met out of whoever is nearest.
 *   Reach = theme?  Step 0 tests Gold and is *about* reading a ledger that does not
 *                   add up. Step 1 tests Heart and is *about* what you say to a man
 *                   who cannot write down what is not there.
 *   Shape           query → prize (packet roll, kept — the batch's query-prize
 *                   floor is met here).
 *   Consequence hand (binding, THR-1145): `condition` + `drive`.
 *                   `condition` — `apply_condition` (`trait.condition.debt-laden`)
 *                   on the failure side: a due met by borrowing is a debt the sheet
 *                   carries out of the scene.
 *                   `drive` — `plant_compulsion` on the success side. The year was
 *                   paid, and paying it leaves the mortal leaning toward work that
 *                   pays — `trade` and `hire` up, `create` down. True on every
 *                   success band, which is why it rides the step's success
 *                   metadata rather than one band's reaction.
 *   Cool failure?   Nobody is arrested. The due is met out of the agent, and the
 *                   debt goes with them down the road.
 *   Systems quota   cast + conditions + reputation + factions — four, one over the
 *                   contract's floor.
 * 
 *   `$realm` binds `factionId` only; see the court-summons doc block for the chip
 *   anchor gap and the deferral filed against it.
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
  id: 'encounter.realm.tithe_demanded',
  tags: ['#crown_errand'],
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'The Tithe Demanded',
  reach: 'gold',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['asceticism_extravagance', 'honesty_cunning'],
  settings: ['rural', 'urban'],
  openings: {
    rural: '{actor} is in {location} on the day the crown\'s collector arrives with a cart and a ledger.',
    urban: '{actor} is in {location} when the crown\'s collector sets up in the square with a cart and a '
      + 'ledger.',
  },
  steps: [
    {
      reach: 'gold',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.35,
      purposeLine: 'Read the ledger',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The crown takes a due from this ground every year and {cast:collector} has come for this one. '
        + 'The ledger says the place paid a third more last year than anyone remembers paying. Nobody can '
        + 'say where the difference went, and the collector will not leave short.',
      successAfterimage: 'They found the year where the figure jumped and could point at the page.',
      failureAfterimage: 'The ledger stayed a column of figures that all looked equally true.',
      successAtCostAfterimage: 'They found the bad year in the ledger, and the collector watched them find it.',
      criticalSuccessAfterimage: 'They found the bad year, the hand that wrote it, and the year before it that matched.',
      criticalFailureAfterimage: 'They read the wrong column aloud and told the collector the place owed more.',
      deal: {
        count: 5,
        tags: ['insight', 'lore'],
      },
      failureMetadata: {
        effects: [
          {
            kind: 'faction_reputation_gain',
            factionId: '$realm',
            amount: -0.03,
          },
          {
            kind: 'apply_condition',
            conditionTraitId: 'trait.condition.shaken',
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
      purposeLine: 'Answer the collector',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: '{cast:collector} closes the ledger and asks who is meeting the difference. The cart is half '
        + 'empty and the crown counts what is on it, not what was written about it. Everyone in earshot has '
        + 'stopped offering.',
      successAfterimage: 'The collector took what the crown was actually owed and wrote it down that way.',
      failureAfterimage: 'The difference was met, and {actor} is the one who met it.',
      successAtCostAfterimage: 'The collector settled for the true figure and took it out of what was nearest.',
      criticalSuccessAfterimage: 'The collector marked the ledger corrected and said so where the place could hear.',
      criticalFailureAfterimage: 'The collector wrote the full figure and took a note of who had argued it.',
      successMetadata: {
        effects: [
          {
            kind: 'faction_reputation_gain',
            factionId: '$realm',
            amount: 0.07,
          },
          {
            kind: 'plant_compulsion',
            targetAgentId: '$actor',
            encounterBias: {
              trade: 0.4,
              hire: 0.3,
              create: -0.2,
            },
            narrativeHook: 'A year settled by counting, and a taste for work that counts.',
          },
        ],
      },
      failureMetadata: {
        effects: [
          {
            kind: 'faction_reputation_gain',
            factionId: '$realm',
            amount: -0.05,
          },
          {
            kind: 'apply_condition',
            conditionTraitId: 'trait.condition.shaken',
            targetAgentId: '$actor',
          },
        ],
      },
      deal: {
        count: 5,
        tags: ['social', 'presence'],
      },
      nudges: [
        {
          id: 'tithe.steady_the_collector',
          name: 'Slow The Reckoning',
          sphere: 'time',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.focus',
          effectLine: 'Stretch the moment before the collector names a figure, so the argument gets made first. A real '
            + 'help.',
          bandProse: {
            success: 'The collector heard them out before he wrote anything down.',
            failure: 'The collector heard the whole argument and wrote the figure he had come with.',
          },
        },
        {
          id: 'tithe.the_place_speaks',
          name: 'Rouse The Square',
          sphere: 'spirit',
          essenceCost: 2,
          forecastDelta: 0.13,
          imageTag: 'generic.crowd',
          effectLine: 'Give the people watching the will to stand behind what is being said. A real help.',
          bandProse: {
            critical_success: 'Half the square said the same year out loud, and the collector struck the figure.',
            success_at_cost: 'The square backed them, and the collector took the difference off the nearest cart anyway.',
            failure: 'The square found its nerve and the collector found his ledger more convincing.',
          },
        },
      ],
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'collector',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['clerk', 'elder', 'merchant'],
      supportRole: 'crown_collector',
      spawnNpcRole: 'clerk',
      spawnName: 'Ottel Grange',
    },
  ],
  narrativeTemplates: {
    initiation: 'The crown\'s due is being counted here today, and the book it is counted from says a bigger '
      + 'number than the place remembers. Somebody meets the difference before the cart leaves.',
    success: 'The crown took what it was owed and the ledger says so now. The cart went on with the right '
      + 'load.',
    failure: 'The cart left full. The difference between the book and the year was made up out of whoever was '
      + 'standing nearest.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The cart is gone and the year is reckoned. What the crown took is what the book will say it '
        + 'took.',
      changes: [
        {
          id: 'tithe.the_ledger_read',
          kind: 'growth',
          title: 'A ledger, read',
          detail: 'An hour against a collector\'s book teaches the gold reach.',
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
          id: 'tithe.sit_down_after',
          label: 'Let them sit down once the cart is gone',
          effects: [
            {
              kind: 'remove_condition',
              conditionTraitId: 'trait.condition.shaken',
            },
          ],
        },
      ],
      byOutcome: {
        success: {
          overview: 'The crown took the true figure and the ledger was corrected in front of the place. The cart went '
            + 'on lighter than it came for.',
          changes: [
            {
              id: 'tithe.ledger_corrected',
              kind: 'faction_reputation',
              category: 'boon',
              direction: 'gain',
              stateNoun: {
                text: 'court standing',
                tooltipId: 'ui.standing',
              },
              title: 'Corrected the book',
              causeClause: 'Found the bad year in the ledger',
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
          overview: 'The collector settled for the true figure and made it up off the nearest cart. The book is right '
            + 'and somebody is still short.',
          changes: [
            {
              id: 'tithe.corrected_and_charged',
              kind: 'faction_reputation',
              category: 'boon',
              direction: 'gain',
              stateNoun: {
                text: 'court standing',
                tooltipId: 'ui.standing',
              },
              title: 'Right, and charged for it',
              causeClause: 'Corrected the figure off a neighbour',
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
        failure: {
          overview: 'The cart left full. {actor} met the difference between the book and the year, and will be '
            + 'meeting it for a while.',
          changes: [
            {
              id: 'tithe.met_the_difference',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              stateNoun: {
                text: 'Shaken',
                entityId: 'trait.condition.shaken',
                visualKind: 'attachment',
              },
              title: 'Met the difference',
              causeClause: 'Squeezed for a shortfall the book invented',
              detail: '{actor} left the square shaken.',
              polarity: 'loss',
              concepts: [
                {
                  text: 'shaken',
                  entityId: 'trait.condition.shaken',
                  visualKind: 'attachment',
                },
              ],
            },
            {
              id: 'tithe.down_in_the_book',
              kind: 'faction_reputation',
              category: 'scar',
              direction: 'loss',
              stateNoun: {
                text: 'court standing',
                tooltipId: 'ui.standing',
              },
              title: 'Down in the book',
              causeClause: 'Argued the due and did not carry it',
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
          overview: '{cast:collector} wrote the whole figure, took a note of who had argued it, and left the place '
            + 'owing more than it did that morning. The difference came out of {actor}.',
          changes: [
            {
              id: 'tithe.wrote_it_up',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              stateNoun: {
                text: 'Shaken',
                entityId: 'trait.condition.shaken',
                visualKind: 'attachment',
              },
              title: 'Carried the whole of it',
              causeClause: 'Held to the whole figure in public',
              detail: '{actor} left the square shaken.',
              polarity: 'loss',
              concepts: [
                {
                  text: 'shaken',
                  entityId: 'trait.condition.shaken',
                  visualKind: 'attachment',
                },
              ],
            },
          ],
        },
      },
    },
  },
  description: 'A two-step tithe collection: read a ledger that does not add up, then answer the collector who '
    + 'cannot leave short. Binds $realm for the standing it moves.',
  locationSubtypes: expandSettings(['rural', 'urban']),
  consequenceDraw: ['condition', 'drive'],
};

export const TITHE_DEMANDED_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
