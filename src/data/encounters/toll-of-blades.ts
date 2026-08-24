/**
 * The Toll of Blades — a two-step `iron` → `stone` test: a war column stopped
 * across the road, taking a toll from everyone who passes, and an afternoon
 * that has to be outlasted before it clears.
 *
 * Batch: border-perils (THR-1221), row 1. Encounter Factory v3, nudge-native,
 * THR-1045 Composition Contract.
 *
 * Design doc: `Docs/plans/encounters/toll-of-blades-final.md`
 * Systems audit: `Docs/plans/encounters/toll-of-blades-systems.md`
 * Package critique: `Docs/plans/encounters/toll-of-blades-package.md` — verdict
 * PACKAGE FIX. The five-item fix list in its § 4 is applied below; see the
 * inline notes at each site.
 *
 * **Fix list applied (package.md § 4), summary:**
 * 1. `toll.the_company_noticed` (BOON standing) folded from `critical_success`
 *    AND `success` — the `membership_change` join fired in the same
 *    `successMetadata` masks the pairwise `reputation_with` edge
 *    (`getReputationWith` reads membership first), so a chip claiming standing
 *    rose would render false on both bands it appeared on. The write stays.
 * 2. `toll.on_the_rolls` (PATH membership) added to `success` with
 *    success-flavoured `causeClause` and overview clause, so folding #1 does
 *    not leave `success` chipless.
 * 3. `toll.what_the_column_left` (SCAR a wound) folded from `critical_failure`
 *    — step 1's own `critical_failure` forces immediate resolution
 *    (`advanceStep`), so step 2's `failureMetadata` never fires on that path.
 *    Stays on `failure`, unchanged.
 * 4. `toll.an_easy_row` (SCAR standing) duplicated onto step 1's own
 *    `failureMetadata` and raised from -0.10 to -0.15 on both steps — the
 *    prior magnitude never crossed a `REPUTATION_WORDS` band boundary.
 * 5. The `critical_failure` overview rewritten so it is true whether the line
 *    broke at the toll (step 1's own critical failure) or under the tail
 *    (step 2's). Pack theft kept — the design block licenses it on this band.
 */

import type { ActionStep, StepNudge, TraitVariant, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { EncounterSupportActorSpec, EncounterSupportBundle } from '../../types/encounter';
import { expandSettings } from '../settingClasses';

// ─── Support Bundle ──────────────────────────────────────────────

/**
 * `serjeant` — the one bound cast member (density rule, THR-1130). The person
 * the scene is about at the human scale: reads the row, the Stumble's opposed
 * target, owes a favour at `success_at_cost`, asks for a name at
 * `critical_success`. `must-persist` is load-bearing: two durable facts land
 * on this person (the favour, and the Stumble's condition grant).
 */
const serjeantSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'serjeant',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['quartermaster', 'mercenary'],
  supportRole: 'column_serjeant',
  spawnNpcRole: 'mercenary',
  spawnName: 'Soren Vance',
  factionDefId: 'mercenary_company',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [serjeantSpec];

// ─── The trait hook ──────────────────────────────────────────────

/**
 * `trait.core.core_humility.vice` — the "Proud" pole of Core humility. Built
 * by `buildCoreTrait` from `CORE_CONTINUA` (`coreRegistry.ts`), a seeded
 * definition, so `validateTraitRefs()` does not report it dead.
 * `core_humility` carries `reachCouplings: [{ reach: 'iron', sign: 1 }]` —
 * Humble seeds away from Power-Hungry, so a Proud agent trends toward high
 * `iron`, the exact reach step 1 tests. No gate, no trait-only card — the
 * batch's card-type budget allocates `trait_card` to other rows, and the
 * trait's surface is complete without one: a factor line the holder reads
 * before rolling, paying off in the `critical_success` overview's recruiting
 * criterion ("step aside" is deliberately used in only these two places).
 */
const TOLL_TRAIT_REF = 'trait.core.core_humility.vice';

const TRAIT_VARIANTS: readonly TraitVariant[] = [
  {
    traitId: TOLL_TRAIT_REF,
    forecastDelta: 0.05,
    difficultyDelta: -0.02,
    factorLine: 'Being Proud, they will not be seen to step aside.',
  },
];

// ─── Step 1 hand — `iron`, "Hold the road" (6 cards) ──────────────────
//
// Budget: heavy_hand, stumble, insurance, boost (x2, the <=2 cap), fellowship,
// gambit — the batch's card-type budget for this row, read as a floor
// (Pass 2 ruling). 5 distinct types, 4 distinct spheres (energy, chaos,
// force, spirit), 1 ungated common option, 1 rider (No Middle Ground's
// all_or_nothing). Sum forecastDelta 0.57, inside NUDGE_HAND_MAX_TOTAL_DELTA
// (0.70). Full Weight (0.16) >= NUDGE_BIG_DELTA, so it carries both failure
// bands.

const STEP_1_HAND: readonly StepNudge[] = [
  {
    id: 'toll.a_little_more',
    libraryCardId: 'card.boost.core',
    name: 'A Little More',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine:
      'You steady them at the moment it counts, so the attempt comes out at their best instead of their average. A small help.',
    fiction: 'Most things fail by a margin.',
    bandProse: {
      success: "They held the serjeant's eye through the whole reading of the row.",
      near_miss: 'They did not blink through it. The row got written anyway.',
    },
  },
  {
    id: 'toll.a_sudden_surge',
    libraryCardId: 'card.boost.signature.energy',
    name: 'A Sudden Surge',
    sphere: 'energy',
    essenceCost: 2,
    forecastDelta: 0.10,
    imageTag: 'generic.energy',
    effectLine: 'You pour energy into a body that is being asked for more than it has. A real help.',
    fiction: 'Bodies hold more than they admit.',
    bandProse: {
      success_at_cost: 'The surge went into the shoulder the spear-shaft had found, and it kept them upright.',
      failure: 'The body answered. The column had more bodies.',
    },
  },
  {
    // The batch's `stumble` debut. `opposes` sources the modifier from the
    // bound cast member — the panel reports the serjeant losing their
    // footing, not a nameless tilt in the god's favour.
    id: 'toll.something_gives_way',
    libraryCardId: 'card.stumble.signature.chaos',
    name: 'Something Gives Way',
    sphere: 'chaos',
    essenceCost: 2,
    forecastDelta: 0.12,
    opposes: 'serjeant',
    imageTag: 'generic.matter',
    effectLine:
      'You loosen the ground under the one standing against them. The odds move because the opposition slips, takes the fall badly, and carries it a while. A strong help.',
    fiction: 'Every structure has one loose piece.',
    grants: [
      {
        kind: 'apply_condition',
        conditionTraitId: 'trait.condition.wounded',
        targetAgentId: '$cast:serjeant',
        durationTicks: 36,
        intensity: 0.3,
      },
    ],
    bandProse: {
      success: 'The verge gave under the serjeant mid-sentence, and the sentence never got finished.',
      failure: 'The serjeant went down, got up furious, and finished the row from the mud.',
    },
  },
  {
    id: 'toll.full_weight',
    libraryCardId: 'card.heavy_hand.signature.force',
    name: 'Full Weight',
    sphere: 'force',
    essenceCost: 2,
    forecastDelta: 0.16,
    costs: { detectionDelta: 0.15 },
    imageTag: 'generic.strength',
    effectLine:
      'You put force behind them where the pressure lands, and hold it there. Rival gods can hardly miss a hand this heavy.',
    fiction: 'Subtlety is a choice. This is not it.',
    bandProse: {
      critical_success:
        'The two spears came up and could not come forward. Nobody behind them wanted to be the one who tried next.',
      failure: 'Force met the column head-on, and the column came through it without changing step.',
      critical_failure: 'The push was so plain that four of them came for it at once.',
    },
  },
  {
    id: 'toll.no_middle_ground',
    libraryCardId: 'card.gambit.signature.chaos',
    name: 'No Middle Ground',
    sphere: 'chaos',
    essenceCost: 1,
    forecastDelta: 0.03,
    rider: 'all_or_nothing',
    imageTag: 'generic.luck',
    effectLine: 'You strip the middle out of it, so what is left lands clean or lands hard, with nothing between.',
    fiction: 'Chaos has no use for the adequate.',
    bandProse: {
      critical_success: 'One motion settled it, and the stylus never touched the wax.',
      critical_failure: 'With no middle to land in, they were in the mud before the serjeant finished the row.',
    },
  },
  {
    // Fellowship — no library member (§ 5, `fellowship` has zero members in
    // `NUDGE_CARD_LIBRARY`); a recorded one-off, written to the library's
    // genericity bar.
    id: 'toll.shoulder_to_shoulder',
    name: 'Shoulder To Shoulder',
    sphere: 'spirit',
    essenceCost: 2,
    forecastDelta: 0.10,
    requiresGroup: true,
    imageTag: 'generic.blessing',
    effectLine:
      'Only in company: the group closes up on both sides, so the column has to move a body of people instead of one traveler. A real help.',
    fiction: 'One is moved. Several are negotiated with.',
    bandProse: {
      success: 'The company came up on both sides and the road narrowed for the column instead.',
      near_miss: 'The company held the line together. The serjeant took the lightest pack in the group and moved on.',
    },
  },
];

// ─── Step 2 hand — `stone`, "Outlast the column" (6 cards) ────────────
//
// Budget as above, read as a floor. `card.balm.signature.life` replaces the
// draft's second Stumble (Pass 2 ruling, § 5) — step 2's opposition is an
// afternoon and a pair of legs, not a person to weaken, and the Balm pays off
// `exhausted`, which step 1's own `failureMetadata` mints. Sum forecastDelta
// 0.51. `card.boost.core` and `card.heavy_hand.signature.force` repeat step
// 1's members — both forced (§ 5): `boost.core` is the library's only
// ungated, sphere-less member, and `heavy_hand.signature.force` is the only
// type `force` signs while the batch design obliges two `detectionDelta`
// channels here.

const STEP_2_HAND: readonly StepNudge[] = [
  {
    id: 'toll.by_the_book',
    libraryCardId: 'card.insurance.signature.order',
    name: 'By The Book',
    sphere: 'order',
    essenceCost: 3,
    forecastDelta: 0.04,
    rider: 'floor_at_cost',
    imageTag: 'generic.ward',
    effectLine: 'You set a floor under them. The afternoon can take gear and skin; it cannot take them off their feet.',
    fiction: 'Rules exist so the worst case has a name.',
    bandProse: {
      success_at_cost: 'That had been paid for in advance. The column took its fee out of the pack.',
      critical_failure: 'A bought floor is worth little to a body already under the herd.',
    },
  },
  {
    id: 'toll.a_little_more_again',
    libraryCardId: 'card.boost.core',
    name: 'A Little More',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine:
      'You steady them at the moment it counts, so the attempt comes out at their best instead of their average. A small help.',
    fiction: 'Most things fail by a margin.',
    bandProse: {
      success: 'The third hour was the one that decided it, and they were steady in it.',
      near_miss: 'They were still up when the last wagons came, and sitting by the time those had passed.',
    },
  },
  {
    id: 'toll.the_slow_push',
    libraryCardId: 'card.boost.variation.patient',
    name: 'The Slow Push',
    essenceCost: 1,
    forecastDelta: 0.08,
    requiredUnlock: 'divine.rekindle_thread',
    imageTag: 'generic.vigor',
    effectLine:
      'You lean on them from the first hour and keep leaning, so the worst of it arrives spread out instead of all at once. A real help.',
    fiction: 'Early pressure costs less than late force.',
    bandProse: {
      success: 'The push started at the first hour, and the legs never got the chance to argue.',
      failure: 'The push was steady from the first hour. The afternoon was steadier.',
    },
  },
  {
    id: 'toll.full_weight_held',
    libraryCardId: 'card.heavy_hand.signature.force',
    name: 'Full Weight',
    sphere: 'force',
    essenceCost: 2,
    forecastDelta: 0.16,
    costs: { detectionDelta: 0.12 },
    imageTag: 'generic.strength',
    effectLine:
      'You put force behind them where the pressure lands, and hold it there. Rival gods can hardly miss a hand this heavy.',
    fiction: 'Subtlety is a choice. This is not it.',
    bandProse: {
      critical_success: 'They stood through it like a post driven in, and the column had to go around the post.',
      failure: 'Force held them upright until the last of it ran out, and then they folded.',
      critical_failure: 'Every rider in the column saw a traveler standing too straight for too long, and then not standing.',
    },
  },
  {
    // Replaces the draft's second Stumble (§ 5). Pays off step 1's own
    // failureMetadata mint of `exhausted`.
    id: 'toll.it_passes',
    libraryCardId: 'card.balm.signature.life',
    name: 'It Passes',
    sphere: 'life',
    essenceCost: 2,
    forecastDelta: 0.10,
    imageTag: 'generic.warmth',
    effectLine:
      'You take the tiredness out of the legs before the hours start counting, so the afternoon is met by a rested body. A real help.',
    fiction: 'Most suffering ends. This one ends sooner.',
    grants: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.exhausted' }],
    bandProse: {
      success_at_cost: 'The tiredness went out of the legs early. What the afternoon put back in stayed.',
      near_miss: 'The wait started from rested. Rested only lasts so long.',
    },
  },
  {
    // Fellowship — no library member, same reasoning as step 1's.
    id: 'toll.shared_watch',
    name: 'Shared Watch',
    sphere: 'spirit',
    essenceCost: 2,
    forecastDelta: 0.07,
    requiresGroup: true,
    imageTag: 'generic.blessing',
    effectLine:
      'Only in company: the group splits the standing into shifts, so the hours land on more than one set of legs. A real help.',
    fiction: 'One watch, taken in turns.',
    grants: [
      { kind: 'apply_condition', conditionTraitId: 'trait.condition.inspired', targetAgentId: '$actor', durationTicks: 24 },
    ],
    bandProse: {
      critical_success: 'The company took the standing in shifts, and the column never saw a gap in it.',
      failure: 'The company split the hours evenly, and evenly was still more hours than they had.',
    },
  },
];

// ─── Step 1 ─────────────────────────────────────────────────────

/**
 * Step 1 — `iron`, "Hold the road". Difficulty 0.36 -> `fair`, inside the
 * open-draw ceiling (NUDGE_OFF_REACH_MAX_DIFFICULTY, 0.45). No authored
 * factorLines (THR-892) — the spears, the queue, the tablet and the churned
 * verge are true on every run, priced into the difficulty and carried by the
 * prose.
 *
 * `failBehavior: 'continue_weakened'` — a failed stand does not end the
 * encounter; the column still has to pass, which step 2 then carries.
 */
const step1HoldTheRoad: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0.36,
  purposeLine: 'Hold the road',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  // The setting-neutral spine. The declared opening lands above this at
  // instantiation. Order: two soldiers, the queue, the serjeant with the
  // tablet, the stylus. The serjeant is introduced here, before any later
  // prose refers to them.
  narrativeTemplate:
    'Two soldiers stand across the road with their spears grounded. The line of held travelers is short and ' +
    'getting shorter. A serjeant walks down it through churned verge with a wax tablet and stylus, naming ' +
    'what the column will take from each: a sack, a mule, a good knife. The stylus stops at the agent\'s row.',
  successAfterimage: 'The stylus moved on down the tablet. The pack stayed on the agent\'s back.',
  failureAfterimage: 'The spear-butts came up, and the agent was walked off the road with the tablet still open.',
  successAtCostAfterimage: 'The column took a sack and left the rest, and the serjeant did not look up again.',
  criticalSuccessAfterimage: 'The serjeant looked at the road, looked at them, and left the row blank.',
  criticalFailureAfterimage: 'They went down in the verge with the column\'s boots going past at eye level.',
  /**
   * All durable success-side writes live on step 2, so a chip on any
   * success-side action band is provably backed. No successMetadata here.
   */
  /**
   * `failureMetadata` fires on `failure` and `critical_failure` only
   * (`isStepSuccess` counts `near_miss` as advancing).
   *
   * **Fix #4 (package.md § 4 item 4).** The `reputation_with` effect is added
   * here, duplicating step 2's own failure-side write, so `toll.an_easy_row`
   * (SCAR standing, authored on the `critical_failure` band) is backed on
   * *every* path to that band — including path (a), where step 1 itself rolls
   * `critical_failure` and `advanceStep` terminates the action immediately,
   * so step 2's `failureMetadata` never fires. `reputation_with` is safe to
   * duplicate (unlike `apply_condition`): it moves a score on one edge, no
   * second edge, no doubled modifier. Raised to -0.15 to cross a
   * `REPUTATION_WORDS` band boundary (0.5 -> 0.35, `Accepted` -> `Unknown`);
   * -0.10 left the readout unchanged. Deliberately NOT duplicating the
   * `wounded` apply_condition here — `apply_condition` mints a fresh
   * tick-keyed edge per call with no already-holds check, so a second mint on
   * the compound failure path would leave two live `wounded` edges (fix #3's
   * whole point).
   */
  failureMetadata: {
    effects: [
      { kind: 'apply_condition', conditionTraitId: 'trait.condition.exhausted', targetAgentId: '$actor', durationTicks: 36 },
      { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: -0.15 },
    ],
  },
  nudges: STEP_1_HAND,
};

// ─── Step 2 ─────────────────────────────────────────────────────

/**
 * Step 2 — `stone`, "Outlast the column". Difficulty 0.42 -> `fair`. The
 * final step, so its band prose is the peak-eligible surface.
 * `carryoverFactorLines` — variant by construction, keyed on the band step 1
 * rolled (THR-892).
 *
 * `failBehavior: 'fail_action'` — the final step; failing it ends the action.
 */
const step2OutlastTheColumn: ActionStep = {
  reach: 'stone',
  duration: { min: 2, max: 3 },
  difficulty: 0.42,
  purposeLine: 'Outlast the column',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  carryoverFactorLines: {
    critical_success: {
      text: 'The column saw the row go unwritten and does not press again.',
      polarity: 'for',
      forecastDelta: 0.05,
    },
    success: {
      text: 'Word ran down the line: this one is not worth the argument.',
      polarity: 'for',
      forecastDelta: 0.03,
    },
    success_at_cost: {
      text: 'They yielded a sack, and the column reads them as movable.',
      polarity: 'against',
      forecastDelta: -0.03,
    },
    near_miss: {
      text: 'The serjeant let it pass once and is still watching them.',
      polarity: 'against',
      forecastDelta: -0.02,
    },
    failure: {
      text: 'The column took what it wanted and has learned they yield.',
      polarity: 'against',
      forecastDelta: -0.05,
    },
    critical_failure: {
      text: 'They start the wait from the ground the spear-butts put them on.',
      polarity: 'against',
      forecastDelta: -0.08,
    },
  },
  narrativeTemplate:
    'The agent is at the head of the line, and the column is long: wagons, then a driven herd, then more ' +
    'wagons. The road belongs to it until the last axle is through, most of an afternoon away. What is left ' +
    'to do is stand in it until then. The serjeant is further down the line, still looking back this way.',
  successAfterimage: 'The road came back empty and the agent was still standing on it.',
  failureAfterimage: 'They sat down in the verge before the herd was through, and the rest of the column stepped around them.',
  successAtCostAfterimage: 'They were still standing when the tail cleared, on a leg that had stopped taking weight an hour before.',
  criticalSuccessAfterimage: 'The last wagon went by, and the serjeant put two fingers up as it passed.',
  criticalFailureAfterimage: 'The last of the column stepped over them where they had gone down, and did not slow to do it.',
  /**
   * `successMetadata` fires on `isStepSuccess`, which counts `near_miss` as a
   * success, so every success-side write is unconditionally backed on every
   * success-side action band (`critical_success` requires both steps clean;
   * `success` and `success_at_cost` are only reachable via
   * `computeFinalActionOutcome`, which requires step 2 to have run).
   *
   * The packet's own "ordering note" (writing `reputation_with` before
   * `membership_change` so both writes "mean what they say") is deleted per
   * fix #1 — its premise is wrong. `getReputationWith` dispatches by
   * *priority*, not recency: once the `member_of` edge exists, the pairwise
   * edge is unreadable by every consumer regardless of write order. The
   * `reputation_with +0.12` write stays (it is the read in a world where
   * `resolveFactionNodeId` finds no chapter and the join no-ops), but no chip
   * claims it as a rising standing on a band where the join also fires — see
   * `toll.the_company_noticed`'s removal from both success-side bands below.
   */
  successMetadata: {
    effects: [
      { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: 0.12 },
      {
        kind: 'favor_creation',
        magnitudeRange: [0.2, 0.4],
        context: 'shut the tablet short of what the column was owed, in front of the line',
        debtorAgentId: '$cast:serjeant',
      },
      { kind: 'membership_change', factionId: 'mercenary_company', op: 'join', chronicle: true },
    ],
  },
  /**
   * `failureMetadata` fires on `failure` and `critical_failure` only.
   * Fix #4: `reputation_with` raised from -0.10 to -0.15 (see step 1's
   * failureMetadata comment for the reasoning; identical here).
   */
  failureMetadata: {
    effects: [
      {
        kind: 'apply_condition',
        conditionTraitId: 'trait.condition.wounded',
        targetAgentId: '$actor',
        durationTicks: 48,
        intensity: 0.35,
      },
      { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: -0.15 },
    ],
  },
  nudges: STEP_2_HAND,
};

// ─── Aftermath ───────────────────────────────────────────────────
//
// Choice-less at the mortal level (design block row 6 — this is a test, not a
// fork), so the five bands hang off `fallback.byOutcome`. Reactions live on
// `fallback` and are available on every band (neither band overrides
// `reactions`).

export const TOLL_OF_BLADES_TEMPLATE: UnifiedActionTemplate = {
  id: 'encounter.border.toll_of_blades',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'The Toll of Blades',
  /**
   * `reach: 'iron'` — this is the field `checkConsequenceDraw` /
   * `drawConsequenceHand` read (`template.reach`, not any step's own reach),
   * and the recorded `consequenceDraw` below was drawn and verified live at
   * `--reach iron` (systems.md § 10). `stone` is step 2's reach, not the
   * template's.
   */
  reach: 'iron',
  crudType: 'update',
  scale: 'local',

  steps: [step1HoldTheRoad, step2OutlastTheColumn],

  apCost: 1,
  actorAffinities: ['individual'],

  /**
   * `mercy_ruthlessness` (Iron's own pair, Protector <-> Conqueror) is the
   * axis a stand-and-hold sits on, named directly in the design block's
   * answer to "Reach = theme?". `preservation_transformation` (Stone's own
   * pair, Guardian <-> Shaper) is the axis of holding ground rather than
   * giving way. Neither is a fork — this encounter has none — they are the
   * axes the scene tilts.
   */
  motivations: ['mercy_ruthlessness', 'preservation_transformation'],

  /**
   * Setting envelope (THR-884). Four declared classes, one opening each;
   * `locationSubtypes` derived via `expandSettings`, never hand-written. A
   * four-class envelope inherits no THR-1044 family default support bundle,
   * so this template declares its own — class-honest at all four (design doc
   * § 4).
   */
  settings: ['stronghold', 'ruin', 'wayside', 'battlefield'],
  openings: {
    wayside:
      'The road runs open here. The nearest roof is half a day behind, and the next one further. A column ' +
      'has halted along the verge and settled in: tethered horses stamping and blowing, cook-smoke lying flat ' +
      'in the cold. Travelers stand with their loads on the ground, waiting their turn.',
    ruin:
      'The road here runs through a dead village, roofless walls and grass in the doorways. The column has ' +
      'halted inside it and is taking the place apart for firewood: axes on old beams, the crack and grind of ' +
      'a gable coming down, dust in the throat. A dozen travelers stand in the lane with their loads down, ' +
      'watching.',
    battlefield:
      'The road crosses ground that a battle already used. The turf is broken in long ridges, crows go up and ' +
      'settle again along them, and the smell has not finished leaving. A column has halted here and set ' +
      'people to picking the field over — spear, boot, buckle — cartload by cartload. The queue of held-up ' +
      'travelers reaches back out of sight.',
    stronghold:
      'The road ends at a fortress gate and starts again on the far side. It has stood open since dawn: ' +
      'wagons rolling out loaded, new bread and axle-grease on the air, a clerk shouting tallies over the ' +
      'noise. A column is forming up outside it, filling the road across its whole width.',
  },
  locationSubtypes: expandSettings(['stronghold', 'ruin', 'wayside', 'battlefield']),

  traitVariants: TRAIT_VARIANTS,

  narrativeTemplates: {
    initiation:
      'The column takes what it needs on the way through, and nothing else moves until it has. Waiting for ' +
      'it to clear costs the whole day. Going up to the head of the line costs a share of what the agent is ' +
      'carrying.',
    success: 'The column is gone and the road belongs to whoever is walking it again.',
    failure: 'The column took its toll and moved on up the road. What it left behind, the agent carries.',
  },

  /**
   * consequenceDraw is binding — `check:encounter` recomputes it from the
   * template id and `template.reach`. Verified live at `--reach iron
   * --rarity 2` (systems.md § 10). No consequenceSwap — both families are
   * wired in context: `secret` -> `favor_creation` (step 2 successMetadata),
   * `membership` -> `membership_change` (step 2 successMetadata).
   */
  consequenceDraw: ['secret', 'membership'],

  supportBundle: SUPPORT_BUNDLE,

  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'What went onto the tablet and what stayed off it is riding north with the column.',
      changes: [],
      reactions: [
        {
          id: 'toll.let_them_rest',
          label: 'Let them rest before the road',
          intent: 'The god spends the moment on the body in front of them. The person matters more than the story.',
          effects: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.exhausted' }],
        },
        {
          id: 'toll.let_the_story_travel',
          label: 'Let the column carry the story',
          intent: 'The god spends the moment on what the column says at the next halt. The story matters more than the afternoon.',
          effects: [{ kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: 0.08 }],
        },
      ],
      byOutcome: {
        critical_success: {
          overview:
            'The pack never came off. {cast:serjeant} walked back up the line before the tail was clear, ' +
            'asked for a name, and wrote it in the margin of the tablet. The company keeps a list of people ' +
            'who do not step aside.',
          changes: [
            {
              // Backing write: applyEncounterGrowth at resolution — fires on
              // every step resolution, and critical_success requires both
              // steps to have run. Anchor form per the generated anchor
              // catalog's Stats table: bearer entityId plus stat tooltipId.
              id: 'toll.iron_tested',
              kind: 'growth',
              category: 'boon',
              polarity: 'gain',
              direction: 'gain',
              title: 'Iron, tested',
              causeClause: 'A war column that came forward and stopped',
              detail: "{actor}'s capability in the iron reach moved. Standing a war column down teaches it faster than a drill yard does.",
              stateNoun: { text: 'iron capability', tooltipId: 'reach.iron' },
              concepts: [{ text: 'the iron reach', entityId: '$actor', tooltipId: 'reach.iron' }],
            },
            {
              // Backing write: step 2 successMetadata -> membership_change
              // op:'join'. Fix #1 leaves this chip in place on
              // critical_success (unaffected — only the BOON standing chip
              // that shared this band was folded).
              id: 'toll.on_the_rolls',
              kind: 'future_hook',
              category: 'path',
              polarity: 'gain',
              direction: 'opens',
              storyWeight: 'beat',
              title: 'Written onto the rolls',
              causeClause: 'A recruiting question, asked in the road',
              detail: "{actor} is on the company's member list now, at the lowest rank it keeps.",
              stateNoun: { text: 'a company membership', entityId: '$faction:mercenary_company', visualKind: 'faction' },
              concepts: [{ text: "the company's member list", entityId: '$faction:mercenary_company', visualKind: 'faction' }],
            },
          ],
        },
        success: {
          // Fix #2: added third sentence naming the enrolment (the
          // membership chip below is now promised by the prose above it).
          overview:
            "Two carters watched the whole row and told it again at the next halt. By evening the column's " +
            "officers had heard about the traveler who would not move. Before it moved on, the company took " +
            "their name for its rolls.",
          changes: [
            // Fix #2: `toll.on_the_rolls` moved onto `success` — same
            // backing write as critical_success (step 2 successMetadata ->
            // membership_change op:'join', which fires on every
            // success-side band), success-flavoured causeClause. Replaces
            // the folded `toll.the_company_noticed` BOON standing chip
            // (fix #1), which rendered false here: the join in the same
            // successMetadata makes getReputationWith read the membership
            // leg (0.05) instead of the edge leg (0.62), so a chip claiming
            // standing rose was untrue on this band.
            {
              id: 'toll.on_the_rolls',
              kind: 'future_hook',
              category: 'path',
              polarity: 'gain',
              direction: 'opens',
              storyWeight: 'beat',
              title: 'Written onto the rolls',
              causeClause: 'A name taken for the rolls, on the way past',
              detail: "{actor} is on the company's member list now, at the lowest rank it keeps.",
              stateNoun: { text: 'a company membership', entityId: '$faction:mercenary_company', visualKind: 'faction' },
              concepts: [{ text: "the company's member list", entityId: '$faction:mercenary_company', visualKind: 'faction' }],
            },
          ],
        },
        success_at_cost: {
          overview:
            'A sack went onto the cart and the rest stayed on their back. {cast:serjeant} closed the tablet ' +
            'two rows early to end it there, in front of the whole line, and did not explain why.',
          changes: [
            {
              // Backing write: step 2 successMetadata -> favor_creation,
              // debtorAgentId '$cast:serjeant'. The mechanic names the
              // debtor and creditor, not "the tablet they closed" (rule 0c).
              id: 'toll.the_serjeants_debt',
              kind: 'shell_state',
              category: 'bond',
              polarity: 'gain',
              direction: 'gain',
              title: 'A tablet closed early',
              causeClause: 'Less taken than the column was owed',
              detail: 'The serjeant, {cast:serjeant}, owes {actor} a favour now — and owes the column an explanation.',
              stateNoun: { text: 'a favour owed', entityId: '$cast:serjeant', visualKind: 'agent' },
              concepts: [{ text: 'The serjeant', entityId: '$cast:serjeant', visualKind: 'agent' }],
            },
            // SCAR "a wound" is deliberately not authored on this band: a
            // step-1 failure that continued weakened can still leave a wound
            // present, but "sometimes true" is not a chip. It shows in the
            // automatic delta cluster instead.
          ],
        },
        failure: {
          overview:
            'The road is clear again by evening. What it cost is in the shoulder and the hip, and in the next ' +
            'few days. Getting up takes a while, and walking takes longer.',
          changes: [
            {
              // Backing write: step 2 failureMetadata -> apply_condition
              // wounded on $actor. Plain `failure` is only reachable through
              // step 2's own failure-side roll, so this is backed on every
              // path to this band.
              id: 'toll.what_the_column_left',
              kind: 'trait',
              category: 'scar',
              polarity: 'loss',
              direction: 'loss',
              title: 'Boots and spear-butts',
              causeClause: 'Boots and spear-butts, and no room at the roadside',
              detail: '{actor} is carrying a wound from it, deep enough to show in how they move.',
              stateNoun: { text: 'a wound', entityId: 'trait.condition.wounded', visualKind: 'attachment' },
              concepts: [{ text: 'a wound', entityId: 'trait.condition.wounded', visualKind: 'attachment' }],
            },
          ],
        },
        critical_failure: {
          // Fix #5: rewritten to be true on path (a) — step 1 itself rolls
          // critical_failure, `advanceStep` terminates the action
          // immediately, and step 2's herd never arrives. No longer opens on
          // the herd (step 2's fiction alone). Pack theft kept — the design
          // block licenses it on this band ("a critical failure is a
          // battering and a robbery").
          overview:
            'They went down, and the column went past them either way. What the column did not take, the mud ' +
            'did. They woke at the roadside with the tail of the column already small in the distance.',
          changes: [
            // Fix #3: `toll.what_the_column_left` (SCAR a wound) folded from
            // this band. Its backing write (step 2 failureMetadata) never
            // fires on path (a) — step 1's own critical_failure forces
            // immediate resolution and step 2 never runs. It stays only on
            // `failure` above, where it is provably backed.
            {
              // Backing write: fix #4 duplicated this effect onto step 1's
              // own failureMetadata (in addition to step 2's), so it is
              // backed on every path to critical_failure — (a) step 1 alone,
              // and (b) step 1 continues then step 2 critically fails.
              // Raised from -0.10 to -0.15 to cross a REPUTATION_WORDS band.
              id: 'toll.an_easy_row',
              kind: 'faction_reputation',
              category: 'scar',
              polarity: 'loss',
              direction: 'loss',
              title: 'An easy row',
              causeClause: 'A row the column found easy',
              detail: "{actor}'s standing with the mercenary company went down. The company thinks less of them than it did before the column stopped.",
              stateNoun: { text: 'standing with the company', entityId: '$faction:mercenary_company', visualKind: 'faction' },
              concepts: [
                { text: 'standing', tooltipId: 'ui.standing' },
                { text: 'the mercenary company', entityId: '$faction:mercenary_company', visualKind: 'faction' },
              ],
            },
          ],
        },
      },
    },
  },

  description:
    'A two-step endurance test: a war column stopped across the road, taking a toll from everyone who ' +
    'passes, and an afternoon that has to be outlasted before it clears.',
};
