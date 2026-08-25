/**
 * The Garrison's Price — a two-step `gold` -> `shadow` test: a free company
 * sitting on the only road, a book of honest prices, and the work of getting
 * clear of the figure once it is named.
 *
 * Batch: border-perils (THR-1221), row 6. Encounter Factory v3, nudge-native,
 * THR-1045 Composition Contract.
 *
 * ── Prose Doctrine v2 (THR-1223 batch 3) ──
 * Rewritten 2026-08-25 in narrator mode under the batch-1 calibration rulings:
 * rewrite from scratch in basic game-master language ("clever specificity" is
 * the residue tell of the old mode), and a card's effect line never repeats a
 * word from the card's name. Zero mechanical changes — same steps, effects,
 * seeds, bands, hands.
 * Stake shape (Seed Dice, die 1): Obstruction.
 *
 * Narrator's checklist (12 questions), answered:
 *  1. P1 arrival with {name} and {location}, one per setting class — yes.
 *  2. P2 states the barrier, the company, and the ledger of prices — the
 *     standing arrangement every traveler this week has paid — yes.
 *  3. P3 lands Obstruction: nobody goes past unpaid — yes.
 *  4. Opening ≤80 words composed with any P1 (61–66) — yes.
 *  5. Every sentence a narrator's report; no interior sensation, no camera —
 *     yes.
 *  6. Facts stated, never encoded — "nobody goes past unpaid" is said
 *     outright — yes.
 *  7. Every sentence serves challenge (the barrier) / test (gold, then
 *     shadow) / outcome (through, or the low track) — yes.
 *  8. Nothing referenced before introduction; {cast:officer} enters in the
 *     spine — yes.
 *  9. One named person on stage: {cast:officer} — yes.
 * 10. Stake in one sentence: settle the price and get clear of it, or take
 *     the three-day track around — yes.
 * 11. Cards named imperative verb+noun; effect lines are game effects; no
 *     name-word repetition — yes.
 * 12. All four declared classes have a skeleton opening — yes.
 *
 * Design doc: `Docs/plans/encounters/the-garrisons-price-final.md`
 * Systems audit: `Docs/plans/encounters/the-garrisons-price-systems.md`
 * Package critique: `Docs/plans/encounters/the-garrisons-price-package.md` —
 * verdict PACKAGE FIX. The three-item fix list in its § 5 is applied below;
 * see the inline notes at each site.
 *
 * **Fix list applied (package.md § 5), summary:**
 * 1. The failure-side `reputation_with` delta is raised from -0.06 to -0.15
 *    on BOTH steps' `failureMetadata`. -0.06 never crosses a
 *    `REPUTATION_WORDS` band (0.5 -> 0.44 stays `Accepted`, identical to the
 *    untouched default) and sorts last in `getNotableStandings`, so it could
 *    render no row at all. -0.15 crosses `Accepted` -> `Unknown`. The two
 *    `failureMetadata` blocks are mutually exclusive (`fail_action` on both
 *    steps), so exactly one ever fires — there is no stacking to price in.
 *    The success-side `+0.10` is left exactly as authored: it already
 *    crosses `Accepted` -> `Respected`.
 * 2. `gp.quartermaster_cooled`'s `stateNoun.text` is renamed from "trust with
 *    the quartermaster" to "the quartermaster's regard". The failure
 *    `bond_change` authors `sentimentDelta` only, no `trustDelta`, and
 *    `applyBondEdge` writes trust only when a delta is supplied — so trust is
 *    the one quantity that band does not move. The asymmetry (dealing
 *    straight earns trust; haggling badly only costs warmth) is correct
 *    design and is not "fixed" by adding a `trustDelta`.
 * 3. (Documentation-only, § 14 of the final doc — nothing to change in this
 *    file.) A step-2 near miss is `isStepSuccess`, so it feeds
 *    `computeFinalActionOutcome`'s `hasAnyCost` check and the action resolves
 *    to `success_at_cost`, not a bare `success`. No chip here is mis-backed
 *    by that: `success_at_cost` carries `gp.company_standing`, backed by step
 *    2's `successMetadata`, which fires on `near_miss` exactly as it does on
 *    every other `isStepSuccess` outcome.
 *
 * Not on the fix list, checked and cleared by the package critic: no
 * `removeAll` (the condition is single-minted per run — `fail_action` on
 * both steps makes the two `failureMetadata` blocks mutually exclusive, so
 * there is no compound-failure path to double it), and no fold of
 * `gp.the_figure_follows` (real write, live reader, bearer-anchored, named
 * in prose).
 *
 * **One additional fix, found at implementation by `check:encounter` rather
 * than by any pipeline pass.** Two one-off card `fiction` lines (Side-bet's
 * "Read the Table" and the Favor call's "Call the Debt") addressed the
 * reader as "you" — `fiction` is `scene`-class prose, and `countSecondPerson`
 * scans `scene` + `outcome` classes on any mortal-drawn template
 * (`nudgeAuditDetectors.ts`), where "you" wrongly casts the *mortal* as the
 * player-god. `SECOND_PERSON_FAIL` is 2 and this packet's final doc, as
 * written, carried exactly 2 hits — both on card `fiction`, both from the
 * final doc's own authored text. Reworded to drop the second person while
 * keeping the line's meaning: "Every table tells you more than it means to."
 * -> "Every table tells more than it means to."; "A debt is only useful on
 * the day you name it." -> "A debt is only useful on the day it is named."
 * Neither card is library-sourced, so both are this template's own prose to
 * fix.
 */

import type { ActionStep, StepNudge, TraitVariant, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { EncounterSupportActorSpec, EncounterSupportBundle } from '../../types/encounter';
import { compileOpeningEnvelope, expandSettings } from '../settingClasses';

// ─── Support Bundle ──────────────────────────────────────────────

/**
 * `officer` — the one bound cast member (density rule, THR-1130). The
 * quartermaster who reads the price out of the book and watches it paid or
 * not paid. `must-persist` is load-bearing: two `attachment_grant` agreements
 * name `$cast:officer` as `counterpartyId`, and the `favor_creation` grant
 * names the same key as `debtorAgentId` — all three need this person to
 * still exist at aftermath.
 *
 * `spawnNpcRole: 'quartermaster'` is chosen because it reads at every one of
 * the four declared classes: reuse can fire at a `castle` (`guard_captain`,
 * `stronghold` class) or a `military_outpost` (`quartermaster`, `wayside`
 * class's `camp` subtype), and the guaranteed spawn fallback covers `ruin`,
 * `battlefield`, and every roster-dark `wayside` subtype (`oasis`,
 * `wilderness`) regardless. A `steward` or `noble` would have been
 * stronghold-honest and placeless everywhere else — the failure the
 * exemplar's "miller's boy" is the named counter-example of.
 */
const officerSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'officer',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['quartermaster', 'commander', 'guard_captain'],
  supportRole: 'gate_quartermaster',
  spawnNpcRole: 'quartermaster',
  spawnName: 'Soren Vail',
  factionDefId: 'mercenary_company',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [officerSpec];

// ─── The trait hook ──────────────────────────────────────────────

/**
 * `trait.core.core_hope.vice` — the "Reads each good turn as the bait before
 * the trap" pole of Core hope, a seeded definition live under
 * `validateTraitRefs()`. A traveler who assumes every offer hides a hook
 * haggles harder and reads the book's fine print, which is exactly the
 * `gold` step's action. No gate, no trait-only card: the batch's card-type
 * allocation assigns `trait_card` to other rows, and this encounter's budget
 * (`bargain / favor / side_bet / boost / gambit / heavy_hand`) does not
 * include it — adding one here would spend a type this row was not
 * allocated.
 */
const TRAIT_VARIANTS: readonly TraitVariant[] = [
  {
    traitId: 'trait.core.core_hope.vice',
    forecastDelta: 0.04,
    difficultyDelta: -0.02,
    factorLine: 'Reading the offer for its trap, they ask what the line means.',
  },
];

// ─── Step 1 hand — `gold`, "Hear the terms" (6 cards) ─────────────────
//
// Budget: boost, favor, bargain, gambit, heavy_hand, side_bet — the batch's
// card-type budget for this row. 6 distinct types, 4 distinct spheres
// (order, entropy, chaos, force), 2 ungated common options, 1 rider (No
// Middle Ground's all_or_nothing). Sum forecastDelta 0.54, inside
// NUDGE_HAND_MAX_TOTAL_DELTA (0.70). Press the Scales (0.16) >= NUDGE_BIG_DELTA,
// so it carries both failure bands.

const STEP_1_HAND: readonly StepNudge[] = [
  {
    id: 'gp.a_little_more',
    libraryCardId: 'card.boost.core',
    name: 'Steady the Nerve',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine: 'Hold them calm while the figure is read out, so they do not take the first number to end the silence.',
    fiction: 'Most things fail by a margin.',
    bandProse: {
      success: 'They let the silence sit after the figure, and the figure came down.',
      failure: 'They held calm to the end, and the book still did not move.',
    },
  },
  {
    id: 'gp.the_ledger_opens',
    libraryCardId: 'card.favor.signature.order',
    name: 'Bind an Obligation',
    sphere: 'order',
    essenceCost: 2,
    forecastDelta: 0.10,
    imageTag: 'generic.oath',
    // Pass-2 edit carried from the final doc: the line must not assert a
    // prior obligation the graph does not hold — this card's whole job is to
    // mint one. "Set" (mint now), never "recall an old".
    effectLine:
      'Set a debt in front of the one holding the book, so they deal like a person who owes. A turn is owed back afterwards.',
    fiction: 'Order is only debt everyone agreed to honor.',
    grants: [
      {
        kind: 'favor_creation',
        magnitudeRange: [0.15, 0.3],
        context: 'Dealt fairly at the gate when the book said otherwise',
        debtorAgentId: '$cast:officer',
      },
    ],
    bandProse: {
      success_at_cost: 'The quartermaster dealt like a debtor and priced like one — high, and honest about it.',
      failure: 'A debt went across the table and came back unrecognised.',
    },
  },
  {
    id: 'gp.pay_it_elsewhere',
    libraryCardId: 'card.bargain.signature.entropy',
    name: 'Pay It Elsewhere',
    sphere: 'entropy',
    essenceCost: 0,
    forecastDelta: 0.12,
    costs: { doomDelta: 0.05 },
    imageTag: 'generic.decay',
    effectLine: 'No essence changes hands — the world\'s doom clock runs a shade faster instead.',
    fiction: 'Nothing is free. Some prices are only slower.',
    bandProse: {
      success: 'Nobody at the table could say why it came out light. The clock ran on.',
      critical_failure: 'The clock took the price, and the traveler was still standing where they started.',
    },
  },
  {
    id: 'gp.no_middle_ground',
    libraryCardId: 'card.gambit.signature.chaos',
    name: 'Empty the Middle',
    sphere: 'chaos',
    essenceCost: 1,
    forecastDelta: 0.03,
    rider: 'all_or_nothing',
    imageTag: 'generic.luck',
    effectLine: 'They walk away with the best line in the book or with none of it — nothing in between survives.',
    fiction: 'Chaos has no use for the adequate.',
    bandProse: {
      critical_success: 'No middling figure was ever put on the table. What was left was the one at the bottom.',
      failure: 'No middling figure survived to be agreed to.',
      critical_failure: 'There was one price left on the table by the end, and it was the worst one.',
    },
  },
  {
    id: 'gp.full_weight',
    libraryCardId: 'card.heavy_hand.signature.force',
    name: 'Press the Scales',
    sphere: 'force',
    essenceCost: 2,
    forecastDelta: 0.16,
    costs: { detectionDelta: 0.15 },
    imageTag: 'generic.strength',
    effectLine:
      "Lean on the whole table at once — the company's own arithmetic comes out in the traveler's favour. Rival gods can hardly miss it.",
    fiction: 'Subtlety is a choice. This is not it.',
    bandProse: {
      critical_success: 'The figures stopped agreeing with the company and started agreeing with the traveler.',
      failure: 'The push went on. The company added it up again and got the same figure.',
      critical_failure: 'The push was plain enough that the picket stopped eating to watch, and the quartermaster closed the book.',
    },
  },
  {
    // Side-bet — no library member. `side_bet` has zero members in
    // NUDGE_CARD_LIBRARY (confirmed live against UNIVERSAL_CORE_TYPES /
    // SPHERE_SIGNATURES / HUNGER_UNIQUE_CARDS / VARIATION_MEMBERS in the
    // design packet's § 12): absent from all four, so there is no id to
    // name. Forced, not chosen — do not "repair" this by pointing it at
    // another type's member.
    id: 'gp.worth_keeping',
    name: 'Read the Table',
    essenceCost: 2,
    forecastDelta: 0.07,
    imageTag: 'generic.matter',
    effectLine: 'Win or lose, the traveler leaves knowing what this company is short of. The knowledge keeps.',
    fiction: 'Every table tells more than it means to.',
    grants: [
      {
        kind: 'intelligence',
        category: 'military_position',
        label: 'What the gate company is short of',
        detail:
          'The post is held on a lapsed contract. They are short of pay, salt and boots, and their book prices all three above coin.',
        reliability: 0.8,
      },
    ],
    bandProse: {
      near_miss: 'The figure was never agreed. The shortages behind it were counted anyway.',
      failure: 'No figure was agreed. What they learned while it failed keeps.',
    },
  },
];

// ─── Step 2 hand — `shadow`, "Get out from under" (5 cards) ───────────
//
// Budget as above, read as a floor. 4 distinct types, 4 distinct spheres
// (force, entropy, order, energy), 1 ungated common option, 0 riders. Sum
// forecastDelta 0.53. `card.boost.core` and `card.heavy_hand.signature.force`
// repeat step 1's members, each re-angled to a different job (attention
// during the count vs. nerve at the table; manpower on the day's labour vs.
// arithmetic on the figure).

const STEP_2_HAND: readonly StepNudge[] = [
  {
    id: 'gp.a_little_more_kept',
    libraryCardId: 'card.boost.core',
    name: 'Guard the Count',
    essenceCost: 1,
    forecastDelta: 0.08,
    imageTag: 'generic.focus',
    effectLine: 'Keep their attention on the tally as it is made, so nothing extra goes in behind them.',
    fiction: 'Most things fail by a margin.',
    bandProse: {
      success: 'They watched every mark go down, and the tally ended where it should have.',
      near_miss: 'They caught the extra line going in. Catching it did not stop it.',
    },
  },
  {
    id: 'gp.full_weight_paid',
    libraryCardId: 'card.heavy_hand.signature.force',
    name: 'Drive the Work',
    sphere: 'force',
    essenceCost: 2,
    forecastDelta: 0.15,
    costs: { detectionDelta: 0.15 },
    imageTag: 'generic.strength',
    effectLine:
      "Put strength into the labour itself — a day's tally goes in a third of the day. Rival gods can hardly miss it.",
    fiction: 'Subtlety is a choice. This is not it.',
    bandProse: {
      critical_success: 'The labour went down so fast that the picket came round the wall to watch.',
      failure: 'The strength went in and the tally kept taking it, mark after mark.',
      critical_failure: 'They laboured like three people in front of a company that counts, and the book had already decided what a day was.',
    },
  },
  {
    id: 'gp.pay_it_elsewhere_again',
    libraryCardId: 'card.bargain.signature.entropy',
    name: 'Pay It Elsewhere',
    sphere: 'entropy',
    essenceCost: 0,
    forecastDelta: 0.12,
    costs: { doomDelta: 0.06 },
    imageTag: 'generic.decay',
    effectLine: 'No essence changes hands — the world\'s doom clock runs a shade faster instead.',
    fiction: 'Nothing is free. Some prices are only slower.',
    bandProse: {
      success_at_cost: 'The overage went out to the world. The world will be a while paying it off.',
      failure: 'The debt went out to the world, and the ledger in front of them stayed open.',
    },
  },
  {
    // Favor, call variant — no library member. Both existing Favor members
    // (`card.favor.signature.order`, `card.favor.hunger.bind`) are
    // mint-side; neither face is about collecting a debt on the day you
    // need it. Priced at 1 essence rather than 0 deliberately: this card
    // does not redeem the favor edge, so pricing it on an obligation
    // channel would claim a write nothing performs.
    id: 'gp.a_turn_called_in',
    name: 'Call the Debt',
    sphere: 'order',
    essenceCost: 1,
    forecastDelta: 0.10,
    requiresFavor: true,
    imageTag: 'generic.oath',
    effectLine:
      'Only when the traveler is owed: bring what is owed to mind, and the one who owes it turns up to stand the work.',
    fiction: 'A debt is only useful on the day it is named.',
    bandProse: {
      success: 'Two pairs of hands finished a tally written for one, and the ledger closed on time.',
      critical_failure: 'The debt was answered, and the book has a line for every pair of hands that comes through the gate.',
    },
  },
  {
    id: 'gp.a_sudden_surge',
    libraryCardId: 'card.boost.signature.energy',
    name: 'Kindle Blood',
    sphere: 'energy',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.energy',
    effectLine: 'When the work outlasts them, the body finds the last hour of it.',
    fiction: 'Bodies hold more than they admit.',
    bandProse: {
      success: 'The last hour came out of a reserve they had not budgeted for.',
      failure: 'There was one more hour in them. The tally asked for three.',
    },
  },
];

// ─── Step 1 ─────────────────────────────────────────────────────

/**
 * Step 1 — `gold`, "Settle the price". Difficulty 0.40 -> `fair`, inside the
 * open-draw ceiling (NUDGE_OFF_REACH_MAX_DIFFICULTY, 0.45). No authored
 * factorLines (THR-892) — "the company is short of pay", "the book sets the
 * figure" and "the picket is watching" read identically on every run, so
 * they are priced into the difficulty and carried by the prose.
 *
 * `failBehavior: 'fail_action'` — a failed negotiation *is* the exit. The
 * opt-in gate lives entirely outside the template (agent selection); a
 * failed haggle here still ends the encounter on the low track, the same
 * road declining takes, plus the shave this step's own failureMetadata
 * writes.
 */
const step1SettleThePrice: ActionStep = {
  reach: 'gold',
  duration: { min: 1, max: 2 },
  difficulty: 0.4,
  purposeLine: 'Settle the price',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  // The setting-neutral P2+P3 spine (Doctrine v2). The per-class P1 arrival
  // lands above this at instantiation. The quartermaster is introduced here
  // by cast token, before any later prose refers to them.
  narrativeTemplate:
    'A free company has put a barrier across the road and charges for passage. Their quartermaster, ' +
    '{cast:officer}, keeps the prices in a ledger and reads them out — a day of work, a piece of kit, an ' +
    'errand carried on.\n\n' +
    'Nobody goes past unpaid. The price has to be settled before the barrier lifts.',
  successAfterimage: 'They settled on a figure and watched it go into the ledger.',
  failureAfterimage: 'No figure was agreed. The quartermaster closed the book.',
  successAtCostAfterimage: 'The figure went into the ledger heavier than the book\'s own line for it.',
  criticalSuccessAfterimage: 'The quartermaster read them the smallest price on the page and wrote it down.',
  criticalFailureAfterimage: 'The haggling ran long and got nowhere. The book did not move.',
  /**
   * `failureMetadata` fires on `failure` and `critical_failure` — the two
   * outcomes `fail_action` ends the action on directly. This is the
   * editorial repair the Systems pass verified by hand (final doc § 17,
   * systems doc § 0): `applyStepOutcomeEffects` runs before `advanceStep`,
   * so a step's own effects fire the moment *that step* resolves,
   * independent of whether the action then continues or terminates — step 2
   * never runs on this path, so every failure-side write that backs a chip
   * on `byOutcome.failure` / `byOutcome.critical_failure` must exist here
   * too, identical to step 2's own failureMetadata.
   *
   * **Fix #1 (package.md § 5 item 1).** `reputation_with` raised from -0.06
   * to -0.15. At -0.06, 0.5 -> 0.44 is still `Accepted` (REPUTATION_WORDS
   * bands are 0.2 wide) — identical to the untouched default — and
   * `getNotableStandings` sorts by departure from neutral, so a 0.06
   * departure sorts last and may not render a row at all. -0.15 crosses
   * `Accepted` -> `Unknown`, at REPUTATION_WITH_MAX_DELTA_PER_OUTCOME. No
   * stacking to price in: `failBehavior: 'fail_action'` on both steps makes
   * this block and step 2's mutually exclusive, so exactly one ever fires.
   */
  failureMetadata: {
    effects: [
      { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: -0.15 },
      { kind: 'bond_change', withAgentId: '$cast:officer', sentimentDelta: -0.15 },
      {
        kind: 'plant_compulsion',
        targetAgentId: '$actor',
        encounterBias: { trade: 0.6, acquire: 0.5, hire: 0.4 },
        durationTicks: 96,
        narrativeHook: 'The figure the gate quoted keeps coming back to them, and they start taking the work that pays.',
      },
    ],
  },
  nudges: STEP_1_HAND,
};

// ─── Step 2 ─────────────────────────────────────────────────────

/**
 * Step 2 — `shadow`, "Get out from under". Difficulty 0.38 -> `fair`. The
 * final step, so its band prose is the peak-eligible surface.
 * `carryoverFactorLines` — variant by construction, keyed on the band step 1
 * rolled (THR-892). `failure` and `critical_failure` are deliberately absent:
 * step 1's `fail_action` ends the encounter there, so step 2 is unreachable
 * from those bands and a line for them would be authored prose nothing can
 * render.
 *
 * `failBehavior: 'fail_action'` — the final step; failing it ends the
 * action.
 */
const step2GetOutFromUnder: ActionStep = {
  reach: 'shadow',
  duration: { min: 1, max: 2 },
  difficulty: 0.38,
  purposeLine: 'Get out from under',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  carryoverFactorLines: {
    critical_success: { text: 'They owe the cheapest line in the book.', polarity: 'for', forecastDelta: 0.05 },
    success: { text: 'The figure they agreed is one they can carry.', polarity: 'for', forecastDelta: 0.03 },
    success_at_cost: { text: 'They agreed to more than the book asked for.', polarity: 'against', forecastDelta: -0.03 },
    near_miss: { text: 'The ledger says more than they remember saying.', polarity: 'against', forecastDelta: -0.05 },
  },
  narrativeTemplate:
    'Naming the price was quick. Paying it is not. The company wants the full measure counted in front of ' +
    'everyone, and a ledger with an open line is a ledger that grows.',
  successAfterimage: 'They counted it out in front of the picket, and the quartermaster called it settled.',
  failureAfterimage: 'The tally ran past what they had left, and the quartermaster stopped counting.',
  successAtCostAfterimage: 'The ledger closed, but a second line went in beside the first before it did.',
  criticalSuccessAfterimage: 'They paid, the line was struck through, and the company let them go early.',
  criticalFailureAfterimage: 'The company kept them a full day, and the day went into the book as well.',
  /**
   * `successMetadata` fires on `isStepSuccess`, which counts `near_miss` as
   * a success — so both writes here are unconditionally backed on every
   * success-side action band (`critical_success` and plain `success` need
   * step 2 to have run clean; `success_at_cost` is reachable via a
   * `near_miss` at either step, and this metadata still fires because it
   * keys on step 2's own outcome).
   */
  successMetadata: {
    effects: [
      { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: 0.1 },
      { kind: 'bond_change', withAgentId: '$cast:officer', sentimentDelta: 0.2, trustDelta: 0.15 },
    ],
  },
  /**
   * `failureMetadata` fires on `failure` and `critical_failure` only. The
   * three effects shared with step 1's own failureMetadata are duplicated
   * here (identical, per the editorial repair), plus the condition the
   * player watched them earn — authored ONLY here, deliberately: `failure`
   * and `critical_failure` are both reachable without step 2 ever running
   * (step 1 alone can end the action there), and a chip claiming "the day's
   * labour left an exhaustion" on a run where the mortal never left the
   * table is exactly the defect this packet exists not to ship. The write
   * stays real and unchipped (THR-1082's automatic delta cluster is the
   * sanctioned surface for it).
   *
   * Fix #1: `reputation_with` raised from -0.06 to -0.15, same reasoning as
   * step 1's block.
   */
  failureMetadata: {
    effects: [
      { kind: 'condition_attachment', templateId: 'trait.condition.exhausted', targetAgentId: '$actor' },
      { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: -0.15 },
      { kind: 'bond_change', withAgentId: '$cast:officer', sentimentDelta: -0.15 },
      {
        kind: 'plant_compulsion',
        targetAgentId: '$actor',
        encounterBias: { trade: 0.6, acquire: 0.5, hire: 0.4 },
        durationTicks: 96,
        narrativeHook: 'The figure the gate quoted keeps coming back to them, and they start taking the work that pays.',
      },
    ],
  },
  nudges: STEP_2_HAND,
};

// ─── Aftermath ───────────────────────────────────────────────────
//
// Choice-less (the one decision — engage vs. decline — is resolved entirely
// outside the template by ordinary agent selection), so the five bands hang
// off `fallback.byOutcome`. `fallback.changes` is deliberately empty: every
// chip this encounter authors is backed by a band-specific write, so every
// chip lives on its band, never on the un-banded variant.

export const THE_GARRISONS_PRICE_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope({
  id: 'encounter.border.the_garrisons_price',
  rarityTier: 2,
  intrinsicTier: 'background',
  name: "The Garrison's Price",
  /**
   * `reach: 'gold'` — the field `checkConsequenceDraw` / `drawConsequenceHand`
   * read (`template.reach`, not any step's own reach). The recorded
   * `consequenceDraw` below was drawn and verified live at `--reach gold
   * --rarity 2`, which reproduces the pre-swap `['relationship', 'thread']`
   * hand the swap below trades against (systems doc § 4; re-probed directly
   * against `draw:consequences` for this pass — rarity 1 and 2 both draw the
   * same 2-member hand, rarity 3 draws a third, unrelated family). `shadow`
   * is step 2's reach, not the template's.
   */
  reach: 'gold',
  crudType: 'update',
  scale: 'local',

  steps: [step1SettleThePrice, step2GetOutFromUnder],

  apCost: 1,
  actorAffinities: ['individual'],

  /**
   * `asceticism_extravagance` (Gold's own pair, Mender <-> Magnate) is the
   * axis a price negotiation sits on directly — what a thing is worth and
   * who sets the figure, step 1's own theme. `honesty_cunning` (Shadow's own
   * pair, Confessor <-> Puppeteer) is the axis of getting out from under a
   * claim without it growing, step 2's theme. Neither is a fork — this
   * encounter has none — they are the axes the scene tilts.
   */
  motivations: ['asceticism_extravagance', 'honesty_cunning'],

  /**
   * Setting envelope (THR-884). Four declared classes, one opening each;
   * `locationSubtypes` derived via `expandSettings`, never hand-written. A
   * four-class envelope inherits no THR-1044 family default support bundle,
   * so this template declares its own — class-honest at all four (final doc
   * § 18).
   */
  settings: ['stronghold', 'ruin', 'wayside', 'battlefield'],
  // P1 arrival, one per class (Doctrine v2) — the P2/P3 spine lands below it
  // (step 1 narrativeTemplate).
  openings: {
    stronghold: '{name} comes up the road to the shut gatehouse of {location}.',
    ruin: 'The road carries {name} through the ruined keep at {location}.',
    wayside: '{name} follows the track toward {location}.',
    battlefield: '{name} reaches the old earthworks at {location}.',
  },
  locationSubtypes: expandSettings(['stronghold', 'ruin', 'wayside', 'battlefield']),

  traitVariants: TRAIT_VARIANTS,

  narrativeTemplates: {
    initiation:
      'There is no other road through these hills. The low track around is three days east.',
    success:
      'The line in the ledger is struck through. The barrier lifted, and the road on is theirs to walk.',
    failure:
      'The barrier stayed down. It is three days east by the low track now.',
  },

  /**
   * consequenceDraw is binding — `check:encounter` recomputes it from the
   * template id and `template.reach`. Verified live at `--reach gold
   * --rarity 2` (re-probed for this pass). `consequenceSwap` trades the
   * drawn `thread` for `drive`: `thread_*` effects take literal `ascendantId`
   * / `mortalId`, and neither field is registered in `SCENE_SENTINEL_FIELDS`,
   * so no `$actor`/`$target`/`$cast` sentinel binds them and the ascendant
   * node id (`asc.<archetypeId>`) is minted per run, leaving no literal an
   * author could ever write — the write no-ops with an `edge_missing` trace
   * while `check:encounter` passes the family on kind-presence alone. `drive`
   * holds weight 4 in `gold` (CONSEQUENCE_FAMILY_WEIGHTS), clearing the >=2
   * bar, and is the truer consequence for this crux: a price the agent
   * cannot get out from under becomes work they cannot stop taking.
   */
  consequenceDraw: ['relationship', 'drive'],
  consequenceSwap: {
    from: 'thread',
    to: 'drive',
    reason:
      'thread_* effects take literal ascendantId and mortalId, and neither field is ' +
      'registered in SCENE_SENTINEL_FIELDS, so no $actor/$target/$cast sentinel binds them; ' +
      'the ascendant node id is minted per run (asc.<archetypeId>), so no literal exists for ' +
      'an author to write. getOutgoingEdges finds nothing and the write no-ops with an ' +
      'edge_missing trace while check:encounter passes the family on kind-presence — a chip ' +
      'over a dead write, which is the Law 56 pathology. drive holds weight 4 in gold ' +
      '(CONSEQUENCE_FAMILY_WEIGHTS), clearing the >=2 bar, and is the truer consequence for ' +
      'this crux: a price the agent cannot get out from under becomes work they cannot stop ' +
      'taking.',
  },

  supportBundle: SUPPORT_BUNDLE,

  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The book is the company\'s whole argument. Every traveler this week was read the same page.',
      changes: [],
      reactions: [
        {
          id: 'gp.keep_the_line',
          label: 'Leave them owing each other',
          intent: 'A courtesy is a relationship, and a relationship is worth more than a closed account.',
          effects: [
            {
              kind: 'attachment_grant',
              templateId: 'agreement.favour.earned',
              targetAgentId: '$actor',
              counterpartyId: '$cast:officer',
              durationOverride: 72,
            },
          ],
        },
        {
          id: 'gp.let_the_road_hear',
          label: 'Let the road hear it',
          intent: 'Settle it publicly and be free of it — cheaper later, and colder.',
          effects: [
            { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: 0.1 },
            { kind: 'reputation_with', targetAgentId: '$cast:officer', delta: 0.06 },
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          // Pass-2 edits (final doc § 17): the drafted overview was a
          // fragment that also restated step 2's criticalSuccessAfterimage
          // word for word. Rewritten to say what the chips below are about
          // — the standing, and the list a company keeps — sharing no verb
          // or object with either afterimage.
          overview:
            'Two soldiers stood aside for them while the light was still good. The company keeps a list of ' +
            'people it does not have to argue with, and there is a name on it now.',
          changes: [
            {
              // Backing write: step 2 successMetadata -> reputation_with
              // (+0.10). Both critical_success and success require step 2
              // to have resolved success-side, which is the sole source of
              // this write.
              id: 'gp.company_standing',
              kind: 'faction_reputation',
              category: 'boon',
              direction: 'gain',
              stateNoun: { text: 'standing with the company', entityId: '$faction:mercenary_company', visualKind: 'faction' },
              title: 'Counted a payer',
              causeClause: 'Paid the line in full where the whole picket could count it',
              detail:
                'The company’s book has them down as a payer now — standing that carries at their other posts.',
              polarity: 'gain',
              concepts: [{ text: 'standing', tooltipId: 'ui.standing' }],
            },
            {
              // Backing write: step 2 successMetadata -> bond_change
              // (sentimentDelta 0.20, trustDelta 0.15).
              id: 'gp.quartermaster_bond',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              stateNoun: { text: 'trust with the quartermaster', entityId: '$cast:officer', visualKind: 'agent' },
              title: "The book-keeper's own word",
              causeClause: 'Dealt straight over a book that did not have to be shown',
              detail:
                '{cast:officer} trusts them further than the company does. That read is the quartermaster’s ' +
                'own, and it did not come out of the ledger.',
              polarity: 'gain',
              concepts: [{ text: 'trusts', tooltipId: 'ui.standing' }],
            },
          ],
        },
        success: {
          overview: 'Nobody made a speech about it. The next traveler in the line moved up a place, and the afternoon went on.',
          changes: [
            {
              // Same chip, same backing write as critical_success — step 2
              // successMetadata -> bond_change fires on every success-side
              // band.
              id: 'gp.quartermaster_bond',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              stateNoun: { text: 'trust with the quartermaster', entityId: '$cast:officer', visualKind: 'agent' },
              title: "The book-keeper's own word",
              causeClause: 'Dealt straight over a book that did not have to be shown',
              detail:
                '{cast:officer} trusts them further than the company does. That read is the quartermaster’s ' +
                'own, and it did not come out of the ledger.',
              polarity: 'gain',
              concepts: [{ text: 'trusts', tooltipId: 'ui.standing' }],
            },
          ],
        },
        success_at_cost: {
          overview:
            'They are through, lighter than the book\'s own figure said they needed to be. The company took ' +
            'what the page said and no more.',
          changes: [
            {
              // Backing write: step 2 successMetadata -> reputation_with
              // (+0.10) fires on every success-side band, near_miss
              // included (near_miss is isStepSuccess). The overage itself
              // is prose, not a chip — nothing writes "they overpaid".
              id: 'gp.company_standing',
              kind: 'faction_reputation',
              category: 'boon',
              direction: 'gain',
              stateNoun: { text: 'standing with the company', entityId: '$faction:mercenary_company', visualKind: 'faction' },
              title: 'Counted a payer',
              causeClause: 'Paid the line in full where the whole picket could count it',
              detail:
                'The company’s book has them down as a payer now — standing that carries at their other posts.',
              polarity: 'gain',
              concepts: [{ text: 'standing', tooltipId: 'ui.standing' }],
            },
          ],
        },
        failure: {
          overview:
            'They will pass this post again — everybody on this road does. The company\'s book keeps the ' +
            'line, and the figure stays the figure.',
          changes: [
            {
              // Backing write: BOTH steps' failureMetadata -> reputation_with
              // (-0.15, fix #1). Reachable whichever step broke.
              id: 'gp.company_standing_lost',
              kind: 'faction_reputation',
              category: 'scar',
              direction: 'loss',
              stateNoun: { text: 'standing with the company', entityId: '$faction:mercenary_company', visualKind: 'faction' },
              title: 'Down in their book',
              causeClause: 'Argued the figure and left without paying it',
              detail: 'The company has them down as a haggler — standing that will cost them at the next post.',
              polarity: 'loss',
              concepts: [{ text: 'standing', tooltipId: 'ui.standing' }],
            },
            {
              // Backing write: BOTH steps' failureMetadata -> bond_change
              // (sentimentDelta -0.15, no trustDelta).
              //
              // Fix #2 (package.md § 5 item 2): stateNoun renamed from
              // "trust with the quartermaster" to "the quartermaster's
              // regard". The write moves sentiment only — applyBondEdge
              // touches trust only when a trustDelta is supplied, and this
              // block does not carry one — so trust is the one quantity
              // this band does not move. The detail ("thinks less of them")
              // is sentiment, which is written; only the state noun was
              // imprecise. Not fixed by adding a trustDelta: the asymmetry
              // (dealing straight earns trust, haggling badly only costs
              // warmth) is correct design.
              id: 'gp.quartermaster_cooled',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              stateNoun: { text: "the quartermaster's regard", entityId: '$cast:officer', visualKind: 'agent' },
              title: 'Cooler across the table',
              causeClause: 'Haggled with the one who has to keep the book straight',
              detail: '{cast:officer} thinks less of them than before. The quartermaster kept the book straight and got argued with for it.',
              polarity: 'loss',
              concepts: [{ text: 'thinks less of them', tooltipId: 'ui.standing' }],
            },
            {
              // Backing write: BOTH steps' failureMetadata -> plant_compulsion.
              // kind: 'shell_state' is correct here (not banned by Law 56 —
              // the ban is only over EMPTY effects) because it names a live
              // write and anchors through its bearer, $actor.
              id: 'gp.the_figure_follows',
              kind: 'shell_state',
              category: 'scar',
              direction: 'loss',
              stateNoun: { text: 'a compulsion to earn', entityId: '$actor', visualKind: 'agent' },
              title: 'The figure follows them',
              causeClause: 'Was quoted an honest price they could not meet',
              detail:
                '{actor} cannot put the number down. For a while now they will take paying work ahead of the ' +
                'road, the errand or the rest.',
              polarity: 'loss',
              concepts: [{ text: 'take paying work', entityId: '$actor', visualKind: 'agent' }],
            },
          ],
          reactions: [
            {
              id: 'gp.let_the_mark_stand',
              label: 'Let the mark stand',
              intent: 'Leave a real open line in a real book — a tie is worth more than a closed account, even here.',
              effects: [
                {
                  kind: 'attachment_grant',
                  templateId: 'agreement.debt.minor',
                  targetAgentId: '$actor',
                  counterpartyId: '$cast:officer',
                  durationOverride: 96,
                },
              ],
            },
            {
              id: 'gp.shave_it_on_the_road',
              label: 'Let the road price the company',
              intent: 'Spend the company’s name to be rid of the mark instead of carrying it.',
              effects: [
                { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: -0.08 },
                { kind: 'reputation_with', targetAgentId: '$cast:officer', delta: 0.05 },
              ],
            },
          ],
        },
        critical_failure: {
          overview: 'They came off the post at dusk with the whole day in the book and nothing to show for it.',
          // Same three chips as `failure`, same backing writes. `byOutcome`
          // keys on the action's band, and nothing distinguishes which step
          // broke — claiming a different chip set here would claim a
          // different write, exactly the defect this pass removed. The two
          // bands differ honestly in `overview` (prose) and in the reaction
          // pair below (the player's own move).
          changes: [
            {
              id: 'gp.company_standing_lost',
              kind: 'faction_reputation',
              category: 'scar',
              direction: 'loss',
              stateNoun: { text: 'standing with the company', entityId: '$faction:mercenary_company', visualKind: 'faction' },
              title: 'Down in their book',
              causeClause: 'Argued the figure and left without paying it',
              detail: 'The company has them down as a haggler — standing that will cost them at the next post.',
              polarity: 'loss',
              concepts: [{ text: 'standing', tooltipId: 'ui.standing' }],
            },
            {
              id: 'gp.quartermaster_cooled',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              stateNoun: { text: "the quartermaster's regard", entityId: '$cast:officer', visualKind: 'agent' },
              title: 'Cooler across the table',
              causeClause: 'Haggled with the one who has to keep the book straight',
              detail: '{cast:officer} thinks less of them than before. The quartermaster kept the book straight and got argued with for it.',
              polarity: 'loss',
              concepts: [{ text: 'thinks less of them', tooltipId: 'ui.standing' }],
            },
            {
              id: 'gp.the_figure_follows',
              kind: 'shell_state',
              category: 'scar',
              direction: 'loss',
              stateNoun: { text: 'a compulsion to earn', entityId: '$actor', visualKind: 'agent' },
              title: 'The figure follows them',
              causeClause: 'Was quoted an honest price they could not meet',
              detail:
                '{actor} cannot put the number down. For a while now they will take paying work ahead of the ' +
                'road, the errand or the rest.',
              polarity: 'loss',
              concepts: [{ text: 'take paying work', entityId: '$actor', visualKind: 'agent' }],
            },
          ],
          reactions: [
            {
              id: 'gp.let_the_day_stand',
              label: 'Let the whole day stand',
              intent: 'Leave the whole day on the account instead of spending anything to close it.',
              effects: [
                {
                  kind: 'attachment_grant',
                  templateId: 'agreement.debt.minor',
                  targetAgentId: '$actor',
                  counterpartyId: '$cast:officer',
                  durationOverride: 144,
                },
              ],
            },
            {
              id: 'gp.walk_it_off',
              label: 'Let them walk it off',
              intent: 'Take the day back out of the body, and let the one who kept them think better of it.',
              effects: [
                // remove_condition no-ops with a trace on the step-1
                // critical-failure path, where no exhaustion was ever
                // applied (it is authored only on step 2's failureMetadata).
                // The bond move rides alongside it so this reaction is
                // never a pure no-op on a reachable path.
                { kind: 'remove_condition', conditionTraitId: 'trait.condition.exhausted', targetAgentId: '$actor' },
                { kind: 'bond_change', withAgentId: '$cast:officer', sentimentDelta: 0.1 },
              ],
            },
          ],
        },
      },
    },
  },

  description:
    'A two-step negotiation: a free company sitting on the only road, an honest price named for passage, and ' +
    'the work of getting clear of the figure once it is settled.',
});
