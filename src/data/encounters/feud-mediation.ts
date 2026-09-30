/**
 * Called to End a Feud — slot 2 of the expert-everyday-1 batch (THR-1678).
 * 
 * Brief: `Docs/plans/encounters/expert-everyday-1-brief.md`.
 * plotHookRolled: hook.rebuilding_trust, hook.compassionate_liberation, hook.unlikely_alliance
 * plotHookTaken:  hook.unlikely_alliance, blended with hook.rebuilding_trust. Two houses
 *                 that hurt each other must sign one contract, and the insulted house is
 *                 at the table again, willing to hear an unbought peacemaker.
 *                 compassionate_liberation survives only as an echo: the house scribe
 *                 who sent the letter leaves the house's service. Nothing in the scene
 *                 is imprisoned, so it is not the lead.
 * Seed Dice:      p3 mystery (who sent the letter) · opposition time (the heads meet
 *                 once, at sundown, and never again) · disposition n/a · agent role
 *                 the target (both houses have sent the mortal a purse) · scale company
 * 
 * ─── The narrator's 12 questions, answered ───────────────────────────
 *   1 P1 arrival?      Yes, per class: `{actor}` arrives in `{location}` at the council's
 *                      request (urban), or comes at the elders' request (rural), to end
 *                      a feud between two powerful houses. Agent and place are graph names.
 *   2 P2 events?       Last spring an insulting letter from `{cast:accused}`'s house broke
 *                      off the two houses' mill contract. The head swears it was never
 *                      sent. Costs already paid: the contract, a season of feud.
 *   3 P3 one stake?    Mystery, as rolled: no one will say who sent the letter. The
 *                      clock and the standing stake are stated plainly beside it.
 *   4 ≤80 words?       Opening + step-0 spine: 79 (urban) / 78 (rural).
 *   5 Read aloud?      Report throughout. No interior sensation anywhere.
 *   6 Stated, never encoded? The stake is stated ('{location} will think less of
 *                      {actor}'), and so is the bribe ('a peacemaker who keeps either
 *                      purse has been bought').
 *   7 Every sentence works? Challenge, test, or outcome.
 *   8 Nothing unintroduced? The letter, the mill contract, the purses, the hall and both
 *                      heads appear in the step spines before a card or chip names them.
 *   9 One named person? `{cast:accused}` in step 0; `{cast:aggrieved}` in steps 1 and 2.
 *  10 Stake in a sentence? 'Can the peacemaker the town sent for find who sent the
 *                      letter and end the feud at the one meeting, or lose the town's trust?'
 *  11 Cards verb+noun, spell-style? Yes; five specials, mechanism-stating, no digits,
 *                      no word shared between a name and its effect line.
 *  12 Opening per class? `urban` and `rural`, both written.
 * 
 * ─── Mechanical design block (designed before the prose) ─────────────
 *   Crux            Two powerful households of the town are in a feud, and the town has
 *                   sent for the mortal to end it at the heads' one meeting at sundown.
 *   Title           Called to End a Feud: the objective and why the mortal is here.
 *   Tier            `shaping`, rarity 2, scale local (brief: the 0.45 open-draw cap binds
 *                   `background` only; the forecast window selects the expert audience).
 *   Steps           eye 0.55 → heart 0.62 → heart 0.68. Mean 0.617, window fit 0.757.
 *   Whose problem?  The mortal's: sent for by name, both houses trying to buy them, and
 *                   the town will judge them by the result (agentRole: the target).
 *   Reach = theme?  Step 0 tests Eye and is about finding who sent the letter. Steps 1
 *                   and 2 test Heart and are about trust: winning it from two proud
 *                   heads, then holding it at one table. Heart by two steps to one.
 *   Shape           Puzzle – Investigation – Resolution. Carryover lines on steps 1 and
 *                   2 key on the band the previous step rolled, so the resolution uses,
 *                   or does without, what the investigation found.
 *   Consequence hand (binding, THR-1145): `companion` + `secret`, no swap.
 *                   `companion` — `grant_companion` `companion.guild-scribe` on the final
 *                   step's success side: the house scribe who sent the letter in error
 *                   leaves the house's service with the mortal who ended the feud.
 *                   `secret` — `hidden_mark` (concealed_action) on `$cast:accused` on step
 *                   0's success side: the investigation finds the letter was the head's
 *                   own angry draft (concealed, not chipped); and `favor_creation`, debtor
 *                   `$cast:accused`, on the final step's success side: the head owes the
 *                   mortal for a peace that left the letter's author unnamed.
 *   Standing        `reputation_with` on `$here`, +0.06 / −0.06 on the final step. The
 *                   town sent for the mortal and the town judges. Chip noun `reputation
 *                   with {location}` anchored on `$here`; no person-anchored reputation
 *                   chip (THR-1685).
 *   Cool failure?   Nobody dies, is jailed or branded. The feud goes on and the town
 *                   thinks less of its peacemaker. Reputation before money.
 *   Systems quota   cast + rewards + reputation — the contract's three.
 *   Heavy Hand      none authored. No rider. No card grants content.
 *   Cast            `accused` reuses noble/elder, `aggrieved` reuses merchant: disjoint
 *                   roles so the two heads never bind one NPC (systems F1).
 * 
 * ─── Trait hooks (mandatory four questions; system target: traits) ──
 *   Gate? No — everyday board, no rule gates by brief. Variant? Yes — Forgiving
 *   (`trait.core.core_forgiveness.virtue`) +0.04, and Vengeful
 *   (`trait.core.core_forgiveness.vice`) −0.04. Trait-only nudge? Yes —
 *   `feud.lay_grudges_down` on step 2, cost 0, unlocked by the Forgiving variant.
 *   Trait fragment? The trait card's own band fragments.
 * 
 * ─── Hands ────────────────────────────────────────────────────────────
 *   Step 0: Boost (witness, mind) + Boost (memory, time), deal 3 insight/social.
 *   Step 1: Stumble (chaos, opposes `aggrieved`), deal 4 presence/social.
 *   Step 2: Boost (oath, order) + Trait card (Forgiving), deal 3 presence/social.
 * 
 * ─── Critic pass (Passes 2/3/3b, 2026-09-30) ─────────────────────────
 *   Editorial PASS WITH REVISIONS · Systems READY WITH CAVEATS · Package PASS
 *   (connected). See feud-mediation-editorial.md / -systems.md / -package.md.
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
  id: 'encounter.town.feud_mediation',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'Called to End a Feud',
  reach: 'heart',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['loyalty_ambition', 'revelation_discretion'],
  settings: ['urban', 'rural'],
  openings: {
    urban: '{actor} arrives in {location} at the council\'s request, to end a feud between two of its great '
      + 'houses.',
    rural: '{actor} comes to {location} at the elders\' request, to end a feud between its two landowning '
      + 'households.',
  },
  steps: [
    {
      reach: 'eye',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.55,
      purposeLine: 'Find who sent it',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The feud began last spring with an insulting letter from the house of {cast:accused}. It broke '
        + 'off the mill contract the two houses shared. {cast:accused} swears the house never sent it, and '
        + 'no one will say who did. The heads will meet only once, at sundown in the hall. If the feud '
        + 'outlasts that meeting, {location} will think less of {actor}.',
      successAfterimage: 'They found that the house scribe sent the letter in error, copied from a draft that was meant to '
        + 'be burned.',
      failureAfterimage: 'They asked in both houses until noon and learned only that the letter was real.',
      successAtCostAfterimage: 'They found the house scribe who sent the letter, and the whole house heard them asking.',
      criticalSuccessAfterimage: 'They found the draft of the letter in {cast:accused}\'s own hand, and the house scribe who sent '
        + 'it in error.',
      criticalFailureAfterimage: 'They named the wrong servant as the sender, and both houses heard of it by noon.',
      successMetadata: {
        effects: [
          {
            kind: 'hidden_mark',
            category: 'concealed_action',
            severity: 0.4,
            label: 'Wrote the letter that began the feud, then swore it was never sent',
            targetAgentId: '$cast:accused',
            revealFamilies: ['investigation'],
          },
        ],
      },
      deal: {
        count: 3,
        tags: ['insight', 'social'],
      },
      nudges: [
        {
          id: 'feud.loosen_a_tongue',
          name: 'Loosen A Tongue',
          sphere: 'mind',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.rumor',
          effectLine: 'Fill frightened witnesses with longing to be rid of what they know, so they tell whoever asks '
            + 'kindly.',
          bandProse: {
            critical_success: 'The house scribe came to {actor} unasked and told the whole of it.',
            success: 'A maid in {cast:accused}\'s house told {actor} who had given the letter to the carrier.',
            failure: 'A groom began to talk, and the steward sent him back to the stables.',
          },
        },
        {
          id: 'feud.wake_old_memory',
          name: 'Wake Old Memory',
          sphere: 'time',
          essenceCost: 2,
          forecastDelta: 0.09,
          imageTag: 'generic.memory',
          effectLine: 'Bring a past day back clear in the minds of those who were there, so they recall who did what.',
          bandProse: {
            success: 'The steward remembered the morning the letter went out, and whose desk it left from.',
            near_miss: 'The steward remembered the morning clearly, but not until late in the day.',
            failure: 'Every servant remembered the day the letter came, and none remembered it leaving.',
          },
        },
      ],
    },
    {
      reach: 'heart',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.62,
      purposeLine: 'Win both heads\' trust',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'Each house has sent {actor} a purse to take its side. {cast:aggrieved}, head of the other house, '
        + 'says a peacemaker who keeps either purse has been bought. {actor} has until sundown to go '
        + 'between the two houses and win the trust of both heads.',
      successAfterimage: 'They sent both purses back, and both heads agreed to hear them out.',
      failureAfterimage: 'One head still believes they were bought, and will say so in the hall.',
      successAtCostAfterimage: 'Both heads agreed to hear them out, and one still has them followed.',
      criticalSuccessAfterimage: 'They sent both purses back, and both heads trusted them the more for it.',
      criticalFailureAfterimage: 'Word went round that they kept a purse, and both heads believe it.',
      carryoverFactorLines: {
        critical_success: {
          text: 'They know who wrote the letter, and who sent it.',
          polarity: 'for',
          forecastDelta: 0.06,
        },
        success: {
          text: 'They know the letter was sent in error.',
          polarity: 'for',
          forecastDelta: 0.04,
        },
        success_at_cost: {
          text: 'The whole house heard them asking questions.',
          polarity: 'against',
          forecastDelta: -0.02,
        },
        near_miss: {
          text: 'They learned who sent it late in the day.',
          polarity: 'against',
          forecastDelta: -0.03,
        },
        failure: {
          text: 'They still do not know who sent the letter.',
          polarity: 'against',
          forecastDelta: -0.05,
        },
        critical_failure: {
          text: 'Both houses heard them name the wrong servant.',
          polarity: 'against',
          forecastDelta: -0.07,
        },
      },
      deal: {
        count: 4,
        tags: ['presence', 'social'],
      },
      nudges: [
        {
          id: 'feud.dull_a_suspicion',
          name: 'Dull A Suspicion',
          sphere: 'chaos',
          essenceCost: 2,
          forecastDelta: 0.1,
          opposes: 'aggrieved',
          imageTag: 'generic.luck',
          effectLine: 'Make doubters lose their train of thought mid-accusation, so their charge comes out weaker than '
            + 'they meant.',
          bandProse: {
            success: '{cast:aggrieved} began the charge of a bought peacemaker and could not finish it.',
            failure: '{cast:aggrieved} faltered, then started the charge again louder.',
          },
        },
      ],
    },
    {
      reach: 'heart',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.68,
      purposeLine: 'Make the peace',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: 'At sundown the two heads take their seats at one table in the hall, and half of {location} '
        + 'crowds the doors. {cast:aggrieved} wants an apology for the letter. The other head will not '
        + 'apologise for a letter the house swears it never sent. {actor} must end the feud before either '
        + 'head walks out.',
      successAfterimage: 'The heads agreed terms and called for a clerk to write them down.',
      failureAfterimage: 'The heads walked out of the hall, and the feud goes on.',
      successAtCostAfterimage: 'The heads agreed terms, but only after each had called {actor} bought before the whole hall.',
      criticalSuccessAfterimage: 'The heads agreed terms before the candles were lit, and shook hands on them.',
      criticalFailureAfterimage: 'The hall broke up in shouting, and both heads left by separate doors.',
      carryoverFactorLines: {
        critical_success: {
          text: 'Both heads trust them, and said so to their houses.',
          polarity: 'for',
          forecastDelta: 0.06,
        },
        success: {
          text: 'Both heads have agreed to hear them out.',
          polarity: 'for',
          forecastDelta: 0.04,
        },
        success_at_cost: {
          text: 'One head still has them followed.',
          polarity: 'against',
          forecastDelta: -0.02,
        },
        near_miss: {
          text: 'One head agreed to come only at the last hour.',
          polarity: 'against',
          forecastDelta: -0.03,
        },
        failure: {
          text: 'One head still believes they were bought.',
          polarity: 'against',
          forecastDelta: -0.05,
        },
        critical_failure: {
          text: 'Both heads believe they kept a purse.',
          polarity: 'against',
          forecastDelta: -0.07,
        },
      },
      successMetadata: {
        effects: [
          {
            kind: 'grant_companion',
            companionTemplateId: 'companion.guild-scribe',
            targetAgentId: '$actor',
          },
          {
            kind: 'favor_creation',
            magnitudeRange: [0.2, 0.35],
            context: 'Kept quiet that the head\'s own angry draft began the feud',
            debtorAgentId: '$cast:accused',
          },
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: 0.06,
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
        tags: ['presence', 'social'],
      },
      nudges: [
        {
          id: 'feud.seal_the_handshake',
          name: 'Seal The Handshake',
          sphere: 'order',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.oath',
          effectLine: 'Make any promise spoken aloud weigh on its speaker, so taking it back comes hard.',
          bandProse: {
            critical_success: 'Both heads said the terms aloud, and neither would be the first to break them.',
            success: '{cast:aggrieved} gave a word in front of the hall and would not take it back.',
            failure: '{cast:aggrieved} gave a word, and took it back before the ink was dry.',
          },
        },
        {
          id: 'feud.lay_grudges_down',
          name: 'Lay Grudges Down',
          requiredTrait: 'trait.core.core_forgiveness.virtue',
          essenceCost: 0,
          forecastDelta: 0.08,
          imageTag: 'generic.mercy',
          effectLine: 'Wake their forgiving nature, so those around them see an old wrong set aside, and follow.',
          bandProse: {
            success: '{actor} set the letter aside as an old wrong, and asked the heads to do the same.',
            failure: '{actor} asked the heads to set the letter aside, and {cast:aggrieved} would not.',
          },
        },
      ],
    },
  ],
  traitVariants: [
    {
      traitId: 'trait.core.core_forgiveness.virtue',
      forecastDelta: 0.04,
      factorLine: 'Being Forgiving, they know how an old wrong is set down.',
      addNudgeIds: ['feud.lay_grudges_down'],
    },
    {
      traitId: 'trait.core.core_forgiveness.vice',
      forecastDelta: -0.04,
      factorLine: 'Being Vengeful, they feel the insult as if it were their own.',
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'accused',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['noble', 'elder'],
      supportRole: 'feud_accused_head',
      spawnNpcRole: 'elder',
      spawnName: 'Osric Venn',
    },
    {
      kind: 'actor',
      key: 'aggrieved',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['merchant'],
      supportRole: 'feud_aggrieved_head',
      spawnNpcRole: 'merchant',
      spawnName: 'Maud Carrow',
    },
  ],
  narrativeTemplates: {
    initiation: 'Two powerful houses of the town have been in a feud since an insulting letter broke off their '
      + 'mill contract. The town has sent for a peacemaker before the heads\' one meeting at sundown.',
    success: 'The two houses signed a new mill contract, and the feud ended at the one meeting.',
    failure: 'The heads walked out of the one meeting, and the feud between the two houses goes on.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The hall empties, and {location} goes home to talk about the two houses.',
      changes: [],
      reactions: [
        {
          id: 'feud.see_the_contract_kept',
          label: 'See the contract kept',
          intent: 'The mortal stays where both houses can see the terms kept, and the town marks who stayed.',
          effects: [
            {
              kind: 'reputation_with',
              targetLocationId: '$here',
              delta: 0.03,
            },
          ],
        },
        {
          id: 'feud.write_down_how_it_began',
          label: 'Write down how the feud began',
          intent: 'The truth about the letter stays with the mortal, written down, however either house tells it '
            + 'later.',
          effects: [
            {
              kind: 'intelligence',
              category: 'political_secret',
              label: 'The Letter That Began The Feud',
              detail: 'An angry draft by the head of one house, sent in error by the house scribe.',
            },
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          overview: 'Both houses sign a new mill contract, and both heads thank {actor} before the whole hall. In '
            + 'private, {cast:accused} admits writing the letter in anger and ordering it burned.',
          changes: [
            {
              id: 'feud.crit.the_towns_regard',
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
              title: 'The town\'s thanks',
              causeClause: 'Ended the feud in one sitting',
              detail: '{location} thinks well of {actor} now.',
            },
            {
              id: 'feud.crit.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              concepts: [
                {
                  text: '{cast:accused}',
                  entityId: '$cast:accused',
                  visualKind: 'agent',
                },
              ],
              title: 'A Favour Owed',
              causeClause: 'Kept the letter\'s author a secret',
              detail: '{cast:accused} owes {actor} a favour.',
            },
            {
              id: 'feud.crit.scribe',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'companion',
                tooltipId: 'ui.companions',
              },
              concepts: [
                {
                  text: 'house scribe',
                  tooltipId: 'ui.companions',
                },
              ],
              title: 'The House Scribe',
              causeClause: 'Sent the letter by mistake and left service',
              detail: 'the house scribe travels with {actor} now.',
            },
          ],
        },
        success: {
          overview: 'The two houses sign a new mill contract before the hall empties. In private, {cast:accused} '
            + 'admits writing the letter in anger and ordering it burned.',
          changes: [
            {
              id: 'feud.success.the_towns_regard',
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
              title: 'The town\'s thanks',
              causeClause: 'Ended the feud at the table',
              detail: '{location} thinks well of {actor} now.',
            },
            {
              id: 'feud.success.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              concepts: [
                {
                  text: '{cast:accused}',
                  entityId: '$cast:accused',
                  visualKind: 'agent',
                },
              ],
              title: 'A Favour Owed',
              causeClause: 'Kept the letter\'s author a secret',
              detail: '{cast:accused} owes {actor} a favour.',
            },
            {
              id: 'feud.success.scribe',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'companion',
                tooltipId: 'ui.companions',
              },
              concepts: [
                {
                  text: 'house scribe',
                  tooltipId: 'ui.companions',
                },
              ],
              title: 'The House Scribe',
              causeClause: 'Sent the letter by mistake and left service',
              detail: 'the house scribe travels with {actor} now.',
            },
          ],
        },
        success_at_cost: {
          overview: 'The houses sign a new mill contract. To show that no house paid for the peace, {actor} turns '
            + 'down any fee for the work. In private, {cast:accused} admits writing the letter in anger and '
            + 'ordering it burned.',
          changes: [
            {
              id: 'feud.cost.the_towns_regard',
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
              title: 'The town\'s thanks',
              causeClause: 'Ended the feud at sundown',
              detail: '{location} thinks well of {actor} now.',
            },
            {
              id: 'feud.cost.favour',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a favour owed',
                tooltipId: 'ui.favour_owed',
              },
              concepts: [
                {
                  text: '{cast:accused}',
                  entityId: '$cast:accused',
                  visualKind: 'agent',
                },
              ],
              title: 'A Favour Owed',
              causeClause: 'Kept the letter\'s author a secret',
              detail: '{cast:accused} owes {actor} a favour.',
            },
            {
              id: 'feud.cost.scribe',
              kind: 'shell_state',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'companion',
                tooltipId: 'ui.companions',
              },
              concepts: [
                {
                  text: 'house scribe',
                  tooltipId: 'ui.companions',
                },
              ],
              title: 'The House Scribe',
              causeClause: 'Sent the letter by mistake and left service',
              detail: 'the house scribe travels with {actor} now.',
            },
          ],
        },
        failure: {
          overview: 'The mill stands idle between the two houses for another season. {location} sent for {actor} '
            + 'because other peacemakers had already failed.',
          changes: [
            {
              id: 'feud.fail.the_towns_regard',
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
              title: 'The town\'s doubt',
              causeClause: 'Could not make the peace',
              detail: '{location} thinks less of {actor} now.',
            },
          ],
          reactions: [
            {
              id: 'feud.stay_taking_no_side',
              label: 'Stay on in town, taking no side',
              intent: 'The mortal stays where both houses can see them, still unbought, and the town marks it.',
              effects: [
                {
                  kind: 'reputation_with',
                  targetLocationId: '$here',
                  delta: 0.03,
                },
              ],
            },
            {
              id: 'feud.side_with_the_insulted',
              label: 'Side with the house that was insulted',
              intent: 'With the peace lost, the mortal backs the house that received the letter, and the other house '
                + 'will remember it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:aggrieved',
                  sentimentDelta: 0.12,
                },
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:accused',
                  sentimentDelta: -0.12,
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview: 'Each head tells their own house that {actor} took the other side. A peacemaker both sides call '
            + 'bought has lost the name that got them sent for.',
          changes: [
            {
              id: 'feud.crit_fail.the_towns_regard',
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
              title: 'Called bought',
              causeClause: 'Lost the one meeting',
              detail: '{location} thinks less of {actor} now.',
            },
          ],
          reactions: [
            {
              id: 'feud.crit_fail.stay_taking_no_side',
              label: 'Stay on in town, taking no side',
              intent: 'The mortal stays where both houses can see them, still unbought, and the town marks it.',
              effects: [
                {
                  kind: 'reputation_with',
                  targetLocationId: '$here',
                  delta: 0.03,
                },
              ],
            },
            {
              id: 'feud.crit_fail.side_with_the_insulted',
              label: 'Side with the house that was insulted',
              intent: 'With the peace lost, the mortal backs the house that received the letter, and the other house '
                + 'will remember it.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:aggrieved',
                  sentimentDelta: 0.12,
                },
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:accused',
                  sentimentDelta: -0.12,
                },
              ],
            },
          ],
        },
      },
    },
  },
  description: 'A three-step expert job in a town: find who sent the insulting letter that began a feud between '
    + 'two powerful houses, win the trust of both heads when each has tried to buy the peacemaker, then '
    + 'make the peace at their one meeting at sundown.',
  locationSubtypes: expandSettings(['urban', 'rural']),
  consequenceDraw: ['companion', 'secret'],
};

export const FEUD_MEDIATION_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
