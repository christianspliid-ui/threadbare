/**
 * The Returned Heir (encounter.town.returned_heir) — slot 1 of master-everyday-3 (THR-1840), the batch's appointment slot.
 * Two-step master Eye job: read a man who comes home claiming to be the lord's son, counted dead
 * in the war seven years ago; then read the household, to sort what he remembers from what he was
 * told. On a finding the master can stand behind, it is sworn before the manor court in the town
 * on court day, in three days, with the steward there to hear it — an `encounter_seed` carrying an
 * `appointment` block (THR-1479), so the step-1 spine may name the place and time (prose rule 7b's
 * one lawful exception). Kept → `town.returned_heir_sworn` (seed-only), missed →
 * `town.returned_heir_defaulted` (seed-only), both hand-authored in `returned-heir-sequels.ts`.
 * 
 * Brief: `Docs/plans/encounters/master-everyday-3-brief.md` (slot 1, binding).
 * Pipeline: `returned-heir-draft.md` → `-editorial.md` → `-revised.md` → `-systems.md` → `-final.md` → `-package.md`.
 * plotHookRolled: hook.assassination_succeeded, hook.monster_eradication, hook.meeting_to_keep.
 * plotHookTaken: hook.meeting_to_keep — the finding must be sworn at the manor court on its day,
 * with the steward there to hear it; kept or missed by where the master stands. The other two
 * fought an everyday manor claim (no one is killed, no beast is hunted).
 * Seed dice: p3 plea (the steward asks the master to read the man) · opposition time (the court
 * sits on its day, ready or not) · disposition n/a · agentRole judge_asked_to_rule · scale
 * settlement (who holds the manor; the template field stays `local`, per the brief). Rolled
 * setting arcane → the manor's muniment room, where the old letters are kept (brief override).
 * 
 * ─── Mechanical design block (designed before the prose) ─────────────
 *   Crux            A man says he is the lord's son, counted dead in the war, and the steward
 *                   asks {actor} to read him before the manor court sits.
 *   Whose problem?  The agent's by request (judge asked to rule): their reading, their sworn
 *                   finding, their name as the master the steward sent for. Scene-local; no
 *                   prior tie to the manor asserted (rule 7).
 *   Reach = theme?  Eye throughout. Step 0 (0.74) reads the man: scars, hands, memory. Step 1
 *                   (0.80) reads the household: who taught him what, who gains. Mean 0.77,
 *                   window fit 0.91 (master). Words: severe, severe.
 *   Shape           Appointment (Seeded Sequel, placed/timed, THR-1479) on a linear two-step.
 *                   Step 0 continue_weakened; step 1 fail_action. Step 1 carries
 *                   carryoverFactorLines keyed on step 0 (no critical_failure row: a step-0
 *                   critical failure ends the action).
 *   Consequence hand (binding, THR-1145): relationship + movement — no swap.
 *     relationship  bond_change with $cast:claimant: +0.12/+0.10 on step 1 success, -0.12/-0.10
 *                   on step 1 failure, -0.08/-0.06 on step 0 failure (he saw the master doubt
 *                   him; backs the critical_failure BOND chip on the step-0 route). BOND chips.
 *     movement      agent_relocation $actor, away ≥3 hexes, travel, on step 1 failure: with no
 *                   finding to swear to, the uncle has the master shown off the manor. PATH chip
 *                   on `failure` only (a step-0 critical failure ends the action before it fires,
 *                   so the critical_failure band claims no road). The success side cannot move
 *                   the master: the appointment binds them to $here.
 *   Appointment     step 1 success: encounter_seed templateId town.returned_heir_sworn,
 *                   delayTicks 36, inheritContext, appointment { locationId $here, counterpartyId
 *                   $cast:steward, missed { templateId town.returned_heir_defaulted } }. PATH chip.
 *   Extras          reputation_with $here +0.06 step 1 success, -0.06 step 1 failure, -0.02 step 0
 *                   failure (backs the critical_failure SCAR on the step-0 route).
 *   Cool failure?   Nobody is hurt, jailed or branded. The cost is the master's name: the court
 *                   sits unread, the uncle keeps the manor, the master is shown the road, and the
 *                   manor will send for someone else next time.
 *   Trait hooks     Gate: none (no rule gates). Variant: Cold (trait.core.core_warmth.vice) +0.04,
 *                   Warm (trait.core.core_warmth.virtue) -0.04 — reading a man while his mother
 *                   weeps for him. Trait-only nudge: none. Trait fragment: none.
 *   Systems quota   cast (claimant, steward) · seeds (the appointment) · relationship · movement
 *                   · reputation · traits.
 *   Cards           Step 0: Show The Scars (Signature, force), Deepen His Sleep (Signature,
 *                   darkness) + deal 3. Step 1: Wake A Conscience (Signature, spirit), Uncover Old
 *                   Letters (Signature, light) + deal 3. No Heavy Hand, no rider, no grants.
 *                   Spheres avoid both eye masters' specials (matter, life, time, entropy, energy,
 *                   mind, chaos) except light, used once by an expert.
 * 
 * ─── The narrator's 12 questions, answered ───────────────────────────
 *   1 P1 arrival?      {actor} arrives in / walks into {location}, sent for by the steward.
 *   2 P2 events?       The son was counted dead in the war seven years ago; a man has walked in
 *                      saying he is that son; the widow says yes, the uncle holding the manor no.
 *   3 P3 one stake?    Plea: the steward asks {actor} to read the man before the court sits.
 *   4 ≤80 words?       Urban 78, rural 77 (opening + step-0 spine).
 *   5 Read aloud?      Every sentence is a report.
 *   6 Stated?          The claim, the widow's yes, the uncle's no, the court's day.
 *   7 Every sentence works? Challenge, test or outcome.
 *   8 Nothing unintroduced? The man, his scars, hands and memory precede step 0's cards; the
 *                      steward's old letters and anyone in the house who could have taught him
 *                      precede step 1's cards.
 *   9 One named person? {cast:claimant} on step 0, {cast:steward} on step 1.
 *  10 Stake in a sentence? 'Can the master read whether the man is the lord's son, and swear
 *                      to it before the manor court sits?'
 *  11 Cards verb+noun? Show, Deepen, Wake, Uncover — all in the lexicon; no effect line repeats
 *                      a word of its name; no digits.
 *  12 Opening per class? urban and rural, both written.
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
  id: 'encounter.town.returned_heir',
  stakes: {
    goal: 'judge the man who says he is the lost heir',
    risk: 'misread the man in front of the whole household',
    won: 'judged the man who says he is the lost heir',
    lost: 'reached no finding and was sent off the manor',
    lostBadly: 'misread the man in front of the whole household',
  },
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Returned Heir',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['honesty_cunning', 'loyalty_ambition'],
  tags: ['#territorial'],
  settings: ['urban', 'rural'],
  openings: {
    urban: '{actor} arrives in {location} on market day, sent for by the manor\'s steward.',
    rural: '{actor} walks into {location} at noon, sent for by the manor\'s steward.',
  },
  steps: [
    {
      reach: 'eye',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.74,
      purposeLine: 'Read the man',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'Seven years ago the lord\'s son went to war and was counted dead. Now {cast:claimant} has walked '
        + 'in, saying he is that son. The widow says he is her boy. The uncle, who holds the manor now, '
        + 'says he is an impostor.\n\n'
        + 'The manor court sits in three days. The steward asks {actor} to read the man: his scars, his '
        + 'hands, and what he remembers.',
      criticalSuccessAfterimage: 'The scar on his chin was the one the son got as a boy, and he told how he got it before anyone '
        + 'asked.',
      successAfterimage: 'His hands were a soldier\'s now, but he told the family\'s oldest stories the way the family '
        + 'tells them.',
      successAtCostAfterimage: 'He told the old stories well, but {actor} heard them in the widow\'s own chamber, and the uncle '
        + 'called the master bought.',
      failureAfterimage: 'War had changed his face and hands too much to read, and he could not name his own horse.',
      criticalFailureAfterimage: '{actor} called a scar on his arm a war wound, and the widow showed the hall it was her son\'s '
        + 'boyhood scar.',
      failureMetadata: {
        effects: [
          {
            kind: 'bond_change',
            withAgentId: '$cast:claimant',
            sentimentDelta: -0.08,
            trustDelta: -0.06,
          },
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: -0.02,
          },
        ],
      },
      deal: {
        count: 3,
        tags: ['insight', 'social'],
      },
      nudges: [
        {
          id: 'heir.show_the_scars',
          name: 'Show The Scars',
          sphere: 'force',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.strength',
          effectLine: 'Tear the man\'s shirt open at the shoulder, so every old wound on his back is in plain sight.',
          bandProse: {
            critical_success: 'His shirt tore on a nail, and the hall saw the old burn on his back that the widow had '
              + 'described.',
            success: 'His shirt tore, and on his back was the old burn the widow had described.',
            near_miss: 'His shirt tore, but the uncle had him covered before {actor} could look closely.',
            failure: 'His shirt tore, and every mark on his back was from the war.',
          },
        },
        {
          id: 'heir.deepen_his_sleep',
          name: 'Deepen His Sleep',
          sphere: 'darkness',
          essenceCost: 1,
          forecastDelta: 0.08,
          imageTag: 'generic.dark',
          effectLine: 'Lay a heavy dark over the man\'s bed tonight, so he talks while dreaming with no guard on what '
            + 'he says.',
          bandProse: {
            success: 'He talked in his sleep and called for the son\'s old nurse by a pet name no servant used.',
            success_at_cost: 'He called for the son\'s old nurse in his sleep, and the uncle\'s man heard {actor} listening at '
              + 'the door.',
            near_miss: 'He talked all night in his sleep, but only in the soldiers\' speech of the war.',
            failure: 'He slept without a word until morning.',
            critical_failure: 'He cried out in his sleep for a woman nobody in the house had heard of.',
          },
        },
      ],
    },
    {
      reach: 'eye',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.8,
      purposeLine: 'Read the household',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: 'Anyone in the house could have taught the man what he knows. The steward, {cast:steward}, keeps '
        + 'the manor\'s old letters, and every servant answers to him. The uncle loses the manor if the man '
        + 'is the heir.\n\n'
        + '{actor} must find out who taught the man what, and who gains. A finding {actor} can stand behind '
        + 'is sworn before the manor court in {location} on court day, with {cast:steward} there to hear '
        + 'it.',
      criticalSuccessAfterimage: '{actor} sorted what the man was told from what he remembered, and what he remembered only the '
        + 'son could know.',
      successAfterimage: '{actor} found who had told him the recent news, and he knew the old stories himself.',
      successAtCostAfterimage: 'The finding stands, but the uncle has sworn to break it before the court.',
      failureAfterimage: '{actor} could not tell what the man remembered from what he had been told, and the uncle had '
        + '{actor} shown the road.',
      criticalFailureAfterimage: 'The uncle questioned the man before the whole household, and he could not answer. The hall '
        + 'laughed at {actor}\'s reading, and the uncle had {actor} shown off the manor.',
      carryoverFactorLines: {
        critical_success: {
          text: 'They know the scar on his chin is the son\'s.',
          polarity: 'for',
          forecastDelta: 0.05,
        },
        success: {
          text: 'They know he tells the old stories the family\'s way.',
          polarity: 'for',
          forecastDelta: 0.03,
        },
        success_at_cost: {
          text: 'The uncle tells the household the widow bought them.',
          polarity: 'against',
          forecastDelta: -0.02,
        },
        near_miss: {
          text: 'They read his hands but not his memory.',
          polarity: 'for',
          forecastDelta: 0.01,
        },
        failure: {
          text: 'War changed the man too much to read by sight.',
          polarity: 'against',
          forecastDelta: -0.03,
        },
      },
      successMetadata: {
        effects: [
          {
            kind: 'bond_change',
            withAgentId: '$cast:claimant',
            sentimentDelta: 0.12,
            trustDelta: 0.1,
          },
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: 0.06,
          },
          {
            kind: 'encounter_seed',
            templateId: 'town.returned_heir_sworn',
            targetAgentId: '$actor',
            delayTicks: 36,
            inheritContext: true,
            seedLabel: 'The finding is sworn before the manor court on court day, with the steward there to hear it.',
            appointment: {
              locationId: '$here',
              counterpartyId: '$cast:steward',
              missed: {
                templateId: 'town.returned_heir_defaulted',
                seedLabel: 'The finding was not sworn on court day, and the man comes looking for the master who made it.',
              },
            },
          },
        ],
      },
      failureMetadata: {
        effects: [
          {
            kind: 'bond_change',
            withAgentId: '$cast:claimant',
            sentimentDelta: -0.12,
            trustDelta: -0.1,
          },
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: -0.06,
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
        ],
      },
      deal: {
        count: 3,
        tags: ['insight', 'lore'],
      },
      nudges: [
        {
          id: 'heir.wake_a_conscience',
          name: 'Wake A Conscience',
          sphere: 'spirit',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.warmth',
          effectLine: 'Trouble whoever coached the man until keeping quiet costs them more than speaking.',
          bandProse: {
            critical_success: 'The widow\'s maid came to {actor} in tears and listed every piece of news she had given him.',
            success: 'The widow\'s maid admitted she had told him the household news since he left.',
            near_miss: 'The widow\'s maid admitted to her mistress what she had told him, and the widow kept it from '
              + '{actor}.',
            failure: 'The widow\'s maid cried in the kitchen all night and told no one why.',
          },
        },
        {
          id: 'heir.uncover_old_letters',
          name: 'Uncover Old Letters',
          sphere: 'light',
          essenceCost: 2,
          forecastDelta: 0.08,
          imageTag: 'generic.light',
          effectLine: 'Turn up a forgotten bundle in the steward\'s chest, so the son\'s own handwriting can be set '
            + 'beside the man\'s.',
          bandProse: {
            success: 'The son\'s letters from the war turned up, and the man wrote the same crooked hand.',
            success_at_cost: 'The letters turned up, and the uncle\'s clerk saw {actor} take them from the steward\'s chest.',
            failure: 'The letters turned up, but the man\'s hand matched them only here and there.',
            critical_failure: 'The letters turned up, and the uncle read aloud a line from them the man could not explain.',
          },
        },
      ],
    },
  ],
  traitVariants: [
    {
      traitId: 'trait.core.core_warmth.vice',
      forecastDelta: 0.04,
      factorLine: 'Being Cold, they read the man and not his mother\'s hope.',
    },
    {
      traitId: 'trait.core.core_warmth.virtue',
      forecastDelta: -0.04,
      factorLine: 'Being Warm, they want the widow to have her son back.',
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'claimant',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['wanderer'],
      supportRole: 'returned_claimant',
      spawnNpcRole: 'wanderer',
      spawnName: 'Aldous Harrow',
    },
    {
      kind: 'actor',
      key: 'steward',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['steward'],
      supportRole: 'manor steward',
      spawnNpcRole: 'steward',
      spawnName: 'Wystan Pell',
    },
  ],
  narrativeTemplates: {
    initiation: 'A man has come home to {location} claiming to be the lord\'s lost son, and the steward has sent '
      + 'for a master to read him.',
    success: 'The finding names the man as the lord\'s son, and is to be sworn before the manor court on court '
      + 'day.',
    failure: 'No finding was made, and the man\'s claim goes to court unread.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The manor has a master\'s reading of the man who says he is the lord\'s son.',
      changes: [],
      reactions: [
        {
          id: 'heir.stand_with_the_son',
          label: 'Sit with the son at his mother\'s table',
          intent: 'The mortal eats with the family on the night before the court sits. The son will remember who '
            + 'sat with him.',
          effects: [
            {
              kind: 'bond_change',
              withAgentId: '$cast:claimant',
              sentimentDelta: 0.04,
            },
          ],
        },
        {
          id: 'heir.keep_it_for_the_court',
          label: 'Keep the finding for the court',
          intent: 'The mortal tells no one what the finding is until the hearing. The town will respect the '
            + 'discretion.',
          effects: [
            {
              kind: 'reputation_with',
              targetLocationId: '$here',
              delta: 0.03,
            },
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          overview: 'The steward has written the finding into the manor rolls, and the widow has asked {actor} to '
            + 'stand beside her son in court.',
          changes: [
            {
              id: 'heir.crit.town_regard',
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
              title: 'A reading trusted',
              causeClause: 'Read the man true',
              detail: '{location} thinks well of {actor} now.',
            },
            {
              id: 'heir.crit.claimant_trust',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'reputation',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{cast:claimant}',
                  entityId: '$cast:claimant',
                  visualKind: 'agent',
                },
                {
                  text: 'trusts',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Son\'s Trust',
              causeClause: 'Named him the son',
              detail: '{cast:claimant} trusts {actor} now.',
            },
            {
              id: 'heir.crit.court_day',
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
                  text: 'hears the finding sworn',
                },
              ],
              title: 'The manor court',
              causeClause: 'Court day',
              detail: '{cast:steward} hears the finding sworn in {location} in three days.',
            },
          ],
        },
        success: {
          overview: 'The steward has the finding in writing, and the manor\'s servants already call the man the young '
            + 'lord.',
          changes: [
            {
              id: 'heir.win.town_regard',
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
              title: 'A reading trusted',
              causeClause: 'Read the man true',
              detail: '{location} thinks well of {actor} now.',
            },
            {
              id: 'heir.win.claimant_trust',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'reputation',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{cast:claimant}',
                  entityId: '$cast:claimant',
                  visualKind: 'agent',
                },
                {
                  text: 'trusts',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Son\'s Trust',
              causeClause: 'Named him the son',
              detail: '{cast:claimant} trusts {actor} now.',
            },
            {
              id: 'heir.win.court_day',
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
                  text: 'hears the finding sworn',
                },
              ],
              title: 'The manor court',
              causeClause: 'Court day',
              detail: '{cast:steward} hears the finding sworn in {location} in three days.',
            },
          ],
        },
        success_at_cost: {
          overview: 'The steward has the finding in writing, and the uncle tells the whole manor the widow bought it.',
          changes: [
            {
              id: 'heir.cost.town_regard',
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
              title: 'A reading trusted',
              causeClause: 'Read the man true',
              detail: '{location} thinks well of {actor} now.',
            },
            {
              id: 'heir.cost.claimant_trust',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'reputation',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{cast:claimant}',
                  entityId: '$cast:claimant',
                  visualKind: 'agent',
                },
                {
                  text: 'trusts',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Son\'s Trust',
              causeClause: 'Named him the son',
              detail: '{cast:claimant} trusts {actor} now.',
            },
            {
              id: 'heir.cost.court_day',
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
                  text: 'hears the finding sworn',
                },
              ],
              title: 'The manor court',
              causeClause: 'Court day',
              detail: '{cast:steward} hears the finding sworn in {location} in three days.',
            },
          ],
        },
        failure: {
          overview: 'The court will sit with no finding before it, and the uncle keeps the manor. The man will face '
            + 'the court with only his mother\'s word.',
          changes: [
            {
              id: 'heir.lost.town_regard',
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
              title: 'No finding',
              causeClause: 'The manor\'s talk',
              detail: '{location} thinks less of {actor} now.',
            },
            {
              id: 'heir.lost.claimant_blame',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'reputation',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{cast:claimant}',
                  entityId: '$cast:claimant',
                  visualKind: 'agent',
                },
                {
                  text: 'blames',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Claimant\'s Blame',
              causeClause: 'His reader failed him',
              detail: '{cast:claimant} blames {actor} now.',
            },
            {
              id: 'heir.lost.on_the_road',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'loss',
              stateNoun: {
                text: 'seed',
                tooltipId: 'ui.aftermath_seed',
              },
              concepts: [
                {
                  text: 'travelling away',
                },
              ],
              title: 'Shown the road',
              causeClause: 'The uncle\'s order',
              detail: '{actor} is travelling away from {location} now.',
            },
          ],
          reactions: [
            {
              id: 'heir.lost.write_to_the_man',
              label: 'Write the man what was found',
              intent: 'The mortal sends the man an honest account of what could and could not be read. He will blame '
                + 'them a little less.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:claimant',
                  sentimentDelta: 0.04,
                },
              ],
            },
            {
              id: 'heir.lost.leave_the_notes',
              label: 'Leave the notes with the steward',
              intent: 'The mortal leaves every note with the steward for the next reader. The steward will remember the '
                + 'honesty.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:steward',
                  sentimentDelta: 0.04,
                  trustDelta: 0.04,
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview: 'The uncle now has a master\'s own error to hold up in court against the man, and the manor will '
            + 'send for someone else next time.',
          changes: [
            {
              id: 'heir.broke.town_regard',
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
              title: 'A misreading',
              causeClause: 'Talk of the household',
              detail: '{location} thinks less of {actor} now.',
            },
            {
              id: 'heir.broke.claimant_blame',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'reputation',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: '{cast:claimant}',
                  entityId: '$cast:claimant',
                  visualKind: 'agent',
                },
                {
                  text: 'blames',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'The Claimant\'s Blame',
              causeClause: 'Misread before his mother',
              detail: '{cast:claimant} blames {actor} now.',
            },
          ],
          reactions: [
            {
              id: 'heir.broke.write_to_the_man',
              label: 'Write the man what was found',
              intent: 'The mortal sends the man an honest account of what could and could not be read. He will blame '
                + 'them a little less.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:claimant',
                  sentimentDelta: 0.04,
                },
              ],
            },
            {
              id: 'heir.broke.leave_the_notes',
              label: 'Leave the notes with the steward',
              intent: 'The mortal leaves every note with the steward for the next reader. The steward will remember the '
                + 'honesty.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:steward',
                  sentimentDelta: 0.04,
                  trustDelta: 0.04,
                },
              ],
            },
          ],
        },
      },
    },
  },
  description: 'Seven years after the lord\'s son was counted dead in the war, a man has come home saying he is '
    + 'that son. Someone has to read the man and the household before the manor court sits, and swear '
    + 'to what they find.',
  locationSubtypes: expandSettings(['urban', 'rural']),
  consequenceDraw: ['relationship', 'movement'],
};

export const RETURNED_HEIR_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
