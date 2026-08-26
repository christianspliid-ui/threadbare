/**
 * The Vertical Slice — the first eight encounters authored in the locked
 * THR-883 format, end to end (Christian's go, chat 2026-07-31).
 *
 * Five parents (one per catalog shape) and three authored sequels, built on
 * the MATURE system tier only (`Docs/canon/encounter-catalogs.md` § System):
 * movement, cards, traits, conditions, items, forks, carryover — with
 * economy/war/factions/agent-magic appearing as flavor at most.
 *
 *   1. The Unsafe Bridge        — Single Test                (Hook #205)
 *   2. Snow on the Pass         — Test & Consequence         (Hook: original)
 *   3. Riders Behind the Caravan— Puzzle–Investigation–Res.  (Hook #207)
 *   4. A Bargain at the Crossroads — Personality Fork        (Hook #206)
 *      └─ The Full Moon Collection (Seeded Sequel of 4)
 *   5. The Swindled Family      — Opt-in Complication        (Hook #204)
 *      ├─ The Swindler Found       (Seeded Sequel of 5)
 *      └─ The Grateful Kin         (Seeded Sequel of 5)
 *         └─ The Table That Holds  (Seeded Sequel of the Kin — THR-1182)
 *
 * Every design block is in the doc comment above its template. The Seeded
 * Sequel rule is enforced by `__tests__/vertical-slice.test.ts`: every
 * `encounter_seed.templateId` planted here must resolve to a template in this
 * file — a seed naming an unbuilt encounter is the THR-844 rot.
 *
 * Personalization notes (design-block question 8): where a sentence reads
 * "greets the traveler by name" or "he describes the gift", the personalized
 * surface (agent-name token in scene prose; a reach/archetype-keyed gift
 * glimpse) does not exist in the engine yet — the slice authors the narrated
 * form and the gap is ticketed (see the THR-883 checkpoint trail). Nothing
 * here carries a raw token no renderer resolves (the THR-868 lesson).
 *
 * Register: rule zero (game prose, not novel prose). Prose rule 7: no agent
 * history asserted anywhere — the sequels are where history legitimately
 * appears, because their parents mint it.
 *
 * ── Prose Doctrine v2 (THR-1223 batch 5) ──
 * All nine templates rewritten 2026-08-25 in narrator mode under the batch-1
 * calibration rulings: rewrite from scratch in basic game-master language
 * ("clever specificity" is the residue tell of the old mode), and a card's
 * effect line never repeats a word from the card's name. Zero mechanical
 * changes — same steps, effects, seeds, bands, hands.
 *
 * Architecture per template (the composed-opening shape the checker reads):
 * `openings[class]` is a one-sentence P1 arrival with {name}/{location}; the
 * first step's `narrativeTemplate` is the P2+P3 spine (situation & costs, then
 * the stake). Cast members enter the spine by token where the template
 * declares them.
 *
 * Stake shapes recorded (Seed Dice, die 1), per template:
 *   bridge      — Choice (cheap risky crossing, or the long ford)
 *   pass        — Threat (the snow, on a clock)
 *   caravan     — Mystery + Threat (which of thirty; the riders waiting)
 *   crossroads  — Opportunity + Choice (the gift; give the word or keep it)
 *   fullMoon    — Opportunity (the gift is real, already paid for)
 *   family      — Choice (a day spent on strangers, or their own road)
 *   swindler    — Opportunity (the man is here, and known)
 *   kin         — Opportunity (a standing welcome, there to be won)
 *   table       — Threat + Choice (riders half a night out; stand or move)
 *
 * The 12-question narrator's checklist was answered per template during the
 * rewrite; the per-template answers reduce to: P1 arrival with graph names
 * (yes, all 12 class openings); P2 costs-already-paid (yes); P3 one stake
 * shape from the table above (yes); composed ≤80 words (yes, 51–75); narrator
 * report throughout, facts stated not encoded (yes); nothing referenced
 * before introduction, one named person per beat (yes — cast tokens);
 * player-restatable stakes (yes); cards imperative verb+noun with spell-style
 * effect lines (yes — four genuine imperatives added to the checker lexicon:
 * count, keep, thicken, warm).
 */

import type {
  ActionStep,
  ActionStepBranch,
  EncounterAftermathReactionEffect,
  StepNudge,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import type {
  EncounterSupportActorSpec,
  EncounterSupportBundle,
} from '../../types/encounter';
import { DEFAULT_SETTING_SUPPORT_BUNDLES } from '../default-support-bundles';
import { compileOpeningEnvelope, expandSettings } from '../settingClasses';

// ─── Slice tuning (NFP #1) ───────────────────────────────────────────

/** Ticks until the crossroads promise falls due (~11 game days — a moon's turn). */
export const SLICE_FULL_MOON_DELAY_TICKS = 132;
/** Ticks until the swindler resurfaces in a settlement (~8 game days). */
export const SLICE_SWINDLER_DELAY_TICKS = 96;
/** Ticks until word of the kindness runs ahead of the traveler (~20 game days). */
export const SLICE_KIN_DELAY_TICKS = 240;

// ─── Law 56 backing tuning (THR-1141, NFP #1) ────────────────────────
//
// The writes below exist because a consequence chip may only report state the
// engine wrote (UI Law 56). Each number is the *duration or weight* of one such
// write; the chip's sentence was already authored and is unchanged.

/** How long the pass stays shut behind them (~30 game days — a season's tail). */
export const SLICE_PASS_SEASON_DURATION_TICKS = 360;
/** The closed pass is a plain fact of the region, not a portent. */
export const SLICE_PASS_SEASON_INTENSITY = 0.4;
/** Ticks until the crossroads marker can be found again (~15 game days). */
export const SLICE_CROSSROADS_RETURN_DELAY_TICKS = 180;
/** Ticks until word of the swindled family's road comes back (~13 game days). */
export const SLICE_FAMILY_NEWS_DELAY_TICKS = 156;
/** Four days walked inside a hunted column buys a warm edge, not a friendship. */
export const SLICE_CARAVAN_MASTER_SENTIMENT = 0.15;
export const SLICE_CARAVAN_MASTER_TRUST = 0.1;

// ─── Aftermath consequence tuning (THR-973, NFP #1) ──────────────────
//
// The slice's endings are outcome-banded (`byOutcome`) and each carries at
// least one persistent typed consequence, per the April migration bar
// (`Docs/plans/2026-04-16-encounter-template-migration.md`). Two rules govern
// every band below, and both are structural rather than editorial:
//
//   1. `applyAftermathOutcomeBand` replaces `reactions` WHOLESALE when a band
//      supplies them. So a band on a variant whose base reaction plants a seed
//      (the crossroads accept path, the family help path) either restates that
//      seed or authors no reactions at all. Bands that only need different
//      words override `overview` + `changes` and leave the base reaction alone.
//   2. Seeds stay single-sourced (THR-971): a planted `encounter_seed` already
//      renders its own chip from the effect, so no band re-authors it as a
//      `future_hook` change. A `future_hook` change with no seed behind it is a
//      chip promising a sequel that never arrives.

/**
 * Standing tally the slice writes to: the traveler's name on this stretch of road.
 *
 * THR-1207 — was the off-axis `slice.road_repute`, which `isValidReputationTallyKey`
 * refused, so all thirteen writes were discarded at runtime. A name carried between
 * strangers on a road is social regard, so it bands to `heart`.
 *
 * Not `reputation_with`, despite the sweep's default mapping for place-shaped keys:
 * these thirteen sites span six different scenes (bridge, pass, caravan, crossroads,
 * swindler, kin), so the fiction is the traveler's renown rather than one town's
 * opinion — and `targetLocationId: '$target'` only binds when the target really is a
 * place-tier location, which would have swapped a discarded write for a refused one
 * at the scenes that target a person.
 *
 * The polarity lives in the **key**, not in the delta's sign — that is the corpus
 * idiom, and no shipped content writes a negative delta onto a polarity key.
 */
export const SLICE_ROAD_REPUTE_KEY = 'heart.positive';
/** The same standing, gone the other way. */
export const SLICE_ROAD_REPUTE_KEY_ILL = 'heart.negative';
/** One step of road-standing earned. */
export const SLICE_REPUTE_GAIN = 1;
/** The same step, spent the other way — a magnitude on the negative key. */
export const SLICE_REPUTE_LOSS = 1;
/**
 * Nerve spent and not recovered — the authored quintessence erosion for a band
 * where the *character* was shaken rather than hurt (THR-1097, Christian's
 * "loss of confidence" example).
 *
 * Only ever authored on `failure` and `success` bands. `success_at_cost`,
 * `critical_failure` and `critical_success` already move quintessence
 * automatically in `outcomeConsequences.ts`, and authoring a second shift on
 * those bands would charge the same beat twice.
 *
 * Sized between the passive-regen floor and the engine's own encounter-failure
 * erosion (0.03), so a shaken night costs less than a failed mission.
 */
export const SLICE_NERVE_EROSION = -0.02;

/**
 * Severity of a concealed-action mark the slice writes — a thing done quietly
 * that someone else watched. Mid-range on the 0–1 mark scale: heavier than a
 * rumour, lighter than a betrayal, and reachable by an ordinary reveal.
 */
export const SLICE_CONCEALED_ACTION_SEVERITY = 0.45;

/**
 * How warmly the kin's town opens for the traveler — THR-1175.
 *
 * These replace `SLICE_KIN_FAVOR_RANGE` / `SLICE_KIN_FAVOR_FUMBLED_RANGE`, which
 * were favour magnitudes on an `owes_favor` edge the town could never repay. The
 * quantity moved from "how big a debt" to "how wide the door", because the state
 * moved from a person's ledger to a place's condition. Three bands, one axis:
 * tuning how much a gratitude beat is worth is editing these numbers (NFP #1).
 */
/** The welcome when the thanks is taken well. */
export const SLICE_KIN_WELCOME_INTENSITY = 0.55;
/** The welcome when the room carries it — the same door, opened wider. */
export const SLICE_KIN_WELCOME_INTENSITY_WARM = 0.75;
/** The welcome when the thanks is fumbled — kin are stubborn, but it is cooler. */
export const SLICE_KIN_WELCOME_INTENSITY_FUMBLED = 0.3;

/**
 * THR-1206 — the same three bands as **reputation** deltas.
 *
 * The director's ruling retired the bespoke noun these replaced: *"custom concepts
 * are difficult for players to learn and understand. if we do have reputation as our
 * concept for 'the social score that modifies interactions between a and b', then
 * lets use that everywhere."* A standing welcome at Sacred Grove **is** the
 * traveler's reputation with Sacred Grove, so it is now written as one — a
 * `reputation_with` edge the Location Profile reads and every other standing on any
 * surface shares a word vocabulary with.
 *
 * The intensities above stay exported: `trait.condition.location.standing_welcome`
 * remains a registered definition so saved worlds that already carry it still render
 * (THR-1177/1183 read-tolerance pattern). They have no writer left here.
 *
 * Scaled against `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME` (0.15), which is the cap a
 * single outcome may move: the warm band spends most of one scene's allowance, the
 * fumbled band a quarter of it. Ordering is what the chips promise — warm > normal >
 * fumbled — and is pinned by test.
 */
/** Taken well — a clear step up in the town's regard. */
export const SLICE_KIN_WELCOME_DELTA = 0.08;
/** The room carries it — the widest a single evening opens the door. */
export const SLICE_KIN_WELCOME_DELTA_WARM = 0.12;
/** Fumbled — kin are stubborn. The door still opens, less far. */
export const SLICE_KIN_WELCOME_DELTA_FUMBLED = 0.04;

/**
 * THR-1205 — the same three bands as a drawn magnitude, so the chip's cluster
 * scales with the door the reaction actually opens.
 *
 * The intensities above are what the engine writes; these are what the player
 * sees, on the `reputation` ladder's ascending rung index. They are declared
 * beside the intensities on purpose: a band whose door widens without its
 * cluster following is the "hidden in prose" failure THR-1205 was filed for,
 * and keeping the pair adjacent is the cheapest thing that keeps them honest.
 *
 * Before this, all three bands drew a single triangle — `deltaClusterFor`
 * defaults to one when no magnitude is declared — so a warm welcome and a
 * fumbled one were indistinguishable at a glance, and the *only* thing that
 * told them apart was the flavour sentence.
 */
/** Taken well — a clear amount (two marks). */
export const SLICE_KIN_WELCOME_BAND = 2;
/** The room carries it — a great amount (three marks). */
export const SLICE_KIN_WELCOME_BAND_WARM = 3;
/** Fumbled — a slight amount (one mark). The door still opens. */
export const SLICE_KIN_WELCOME_BAND_FUMBLED = 0;

/**
 * Ticks until the town that keeps a door open calls the traveler back to it
 * (THR-1182). One game day, and the number is load-bearing rather than a mood.
 *
 * The welcome The Grateful Kin writes is a `reputation_with` edge, and phase 6.6
 * drifts every such edge toward neutral at `REPUTATION_WITH_DECAY_PER_TICK`,
 * deleting it once inside `REPUTATION_WITH_PRUNE_EPSILON` of neutral. So each of
 * the three planting bands has its own window in which the roof still owes
 * anything, and the seed has to ripen inside the **shortest** of them:
 *
 *   fumbled  0.04 above neutral → pruned after (0.04 − 0.02) / 0.001 = 20 ticks
 *   warm     0.12 above neutral → below `Respected` after (0.12 − 0.10) / 0.001 = 20 ticks
 *
 * Twelve is comfortably inside both, which is what makes the return visit a
 * scene rather than a promise: at ripening the fumbled welcome still exists, and
 * the warm one still clears the organic gate below. Pinned against literals in
 * `__tests__/vertical-slice.test.ts` so a change to either engine constant
 * breaks loudly instead of quietly stranding the sequel.
 *
 * **Why the decay constants and not `CONDITION_STANDING_WELCOME_DURATION`**
 * (THR-1182 Done-when 4, author's call, recorded): that constant governed the
 * retired `trait.condition.location.standing_welcome`, which THR-1206 left with
 * zero writers. Pinning to it would assert against a mechanism no band on this
 * chain writes any more — the dead-gate shape one layer along, which is this
 * ticket's own defect class.
 */
export const SLICE_TABLE_DELAY_TICKS = 12;

/**
 * The band a town's regard must reach before the table scene can be *drawn*
 * (as opposed to planted). THR-1182.
 *
 * `'Respected'` is the only band that gates anything here, and that is
 * arithmetic rather than taste: `REPUTATION_WITH_DEFAULT` is 0.5, which
 * `getReputationWord` bands as `Accepted`, so a gate at `Accepted` is satisfied
 * by every stranger who ever walks in. `Respected` (≥ 0.6) is reachable off the
 * warm band alone (0.5 + 0.12), which is the reading the scene wants: the town
 * calls in the one traveler it actually thinks well of.
 */
export const SLICE_TABLE_GATE_BAND = 'Respected';

export const SLICE_TEMPLATE_IDS = {
  bridge: 'encounter.slice.unsafe_bridge',
  pass: 'encounter.slice.snow_on_the_pass',
  caravan: 'encounter.slice.riders_behind_caravan',
  crossroads: 'encounter.slice.bargain_at_crossroads',
  fullMoon: 'encounter.slice.full_moon_collection',
  family: 'encounter.slice.swindled_family',
  swindlerFound: 'encounter.slice.swindler_found',
  gratefulKin: 'encounter.slice.grateful_kin',
  tableThatHolds: 'encounter.slice.the_table_that_holds',
} as const;

/**
 * The one seed The Grateful Kin plants, declared once and referenced by all
 * three of its bands (THR-1182).
 *
 * Shared rather than copied because the three planting sites are three *bands*
 * of one beat, not three decisions: `applyAftermathOutcomeBand` replaces a
 * variant's `reactions` wholesale, so each band that authors its own reaction
 * has to restate the seed, and three hand-copied literals is three chances for
 * one of them to drift a delay or a label. `inheritContext` is what makes the
 * sequel a return *here* — it copies the source action's `targetId`, which for
 * this beat is the town whose regard the same reaction just moved.
 *
 * No accompanying `future_hook` chip on any band, deliberately: a planted seed
 * already renders its own chip from the effect, and re-authoring one is the
 * double-source THR-971 closed (rule 2 in this file's aftermath header). The
 * THR-1182 description asks for an authored chip; that line predates the rule
 * and is superseded by it.
 */
const SLICE_TABLE_SEED: EncounterAftermathReactionEffect = {
  kind: 'encounter_seed',
  templateId: SLICE_TEMPLATE_IDS.tableThatHolds,
  targetAgentId: '$actor',
  delayTicks: SLICE_TABLE_DELAY_TICKS,
  seedLabel: 'A town that keeps a door open has two families who will not sit together.',
  inheritContext: true,
};

// ═════════════════════════════════════════════════════════════════════
// 1. THE UNSAFE BRIDGE — Single Test (Hook #205)
// ═════════════════════════════════════════════════════════════════════
//
// Crux: the only bridge within a day's walk is failing, and the family that
//       keeps it swears it will hold.
// Shape: Single Test · Setting: wayside · Pressure: fear · Form: collapse ·
// Objective: cross · Stakes: no-penalty (fail → the long ford, exhausted;
// crit-fail → a fall, wounded) · System: movement + conditions ·
// Step: Stone — "Cross the bridge" (weight, footing, nerve).
// Why here: the road crosses here (chance or mission route).
// Connected systems (Q8): conditions ×2, equipment (pack weight as a derived
// line), cards — 3 beyond the core test.
// Choice: none. Promise→payoff: the bridge's true state — the crossing answers.

const BRIDGE_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared focus family, the common option.
    id: 'slice.bridge.sure_feet',
    name: 'Steady the Feet',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine: 'Their balance holds — each plank gets a clean, centered step.',
    bandProse: {
      success: 'Every step landed mid-plank.',
      near_miss: 'Their footing never failed. A plank did.',
    },
  },
  {
    // Type: Boost — force, acting on the structure instead of the walker.
    id: 'slice.bridge.hold_the_timber',
    name: 'Hold the Timber',
    sphere: 'force',
    essenceCost: 2,
    forecastDelta: 0.1,
    imageTag: 'generic.strength',
    effectLine: 'Brace the weakest beam while weight is on it — the bridge carries more than it should.',
    bandProse: {
      success_at_cost: 'The beam lasted to the far post, then split.',
      failure: 'The braced beam lasted. The plank two ahead of it did not.',
      critical_failure: 'The beam lasted until their full weight was on it, and then it gave.',
    },
  },
  {
    // Type: Boost — light, revealing which planks can be trusted.
    id: 'slice.bridge.light_on_the_gaps',
    name: 'Light on the Gaps',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.light',
    effectLine: 'Every soft board and open seam shows dark before it is stepped on.',
    bandProse: {
      critical_success: 'The bad boards showed grey against the sound ones, and the safe path was plain.',
      failure: 'Every bad board showed. The plank that failed had looked sound from above.',
    },
  },
  {
    // Type: Mercy — this hand's ONE rider. Life's gentleness: the river may
    // refuse them, and still hand them back.
    id: 'slice.bridge.small_mercies',
    name: 'Spare the Worst',
    sphere: 'life',
    essenceCost: 3,
    forecastDelta: 0.04,
    rider: 'no_crit_fail',
    imageTag: 'generic.ward',
    effectLine: 'Whatever fails tonight, the river gives them back. The deadliest end is off the table.',
    bandProse: {
      failure: 'The bridge refused them halfway, and the water carried them to the shallows.',
    },
  },
  {
    // Type: Boost — time, slowing the crossing to the bridge's own pace.
    id: 'slice.bridge.patient_steps',
    name: 'Slow the Crossing',
    sphere: 'time',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.focus',
    effectLine: 'They take the careful minute the bridge needs instead of the fast one fear wants.',
    bandProse: {
      near_miss: 'They took it carefully, and care got them across everything except the last board.',
      failure: 'They went carefully all the way to the middle span, and the middle span gave anyway.',
    },
  },
];

const BRIDGE_STEP: ActionStep = {
  reach: 'stone',
  duration: { min: 1, max: 2 },
  difficulty: 0.4,
  purposeLine: 'Cross the bridge',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  // The P2+P3 spine (Doctrine v2). The per-class P1 arrival lands above this
  // at instantiation. The keeper is introduced here by cast token.
  narrativeTemplate:
    'The only bridge sags where the river runs deepest, and its grey planking is rotten. A timber is ' +
    'missing under the middle span. The keeper, {cast:bridge_keeper}, takes two coppers a crossing and ' +
    'swears it holds.\n\n' +
    'Cross on bad boards under a full pack, or lose half a day at the ford upstream.',
  successAfterimage: 'They crossed slow and even, and the bridge held.',
  failureAfterimage: 'The bridge turned them back at the middle span, and the long ford took half the day.',
  successAtCostAfterimage: 'They made the far bank as a plank went into the river behind them.',
  criticalSuccessAfterimage: 'They read the boards right and crossed as if the bridge were new.',
  criticalFailureAfterimage: 'A beam gave under their full weight, and the fall hurt them badly.',
  nudges: BRIDGE_HAND,
};

/**
 * The woman taking coppers for the crossing — the scene's subject, cast by the scene.
 *
 * THR-1165: the `hidden_mark` below used to aim at `$cast:keeper`, which reads as
 * this woman and is not. `keeper` came from the inherited `wayside` default, where
 * it is a bind-only hermit called "Wayside Keeper" — so the mark landed on a passing
 * hermit when one happened to stand there and on nobody otherwise. A materializing
 * spec makes the person the mark is about exist whenever the mark is written.
 */
const BRIDGE_KEEPER_SPEC: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'bridge_keeper',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  supportRole: 'bridge_toll_keeper',
  spawnNpcRole: 'hermit',
  spawnName: 'The Keeper at the Crossing',
};

/** Composed, not replaced — same reasoning as {@link CROSSROADS_SUPPORT_BUNDLE}. */
const BRIDGE_SUPPORT_BUNDLE: EncounterSupportBundle = [
  ...DEFAULT_SETTING_SUPPORT_BUNDLES.wayside,
  BRIDGE_KEEPER_SPEC,
];

export const SLICE_UNSAFE_BRIDGE: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.bridge,
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'The Unsafe Bridge',
  reach: 'stone',
  crudType: 'read',
  scale: 'local',
  steps: [BRIDGE_STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  settings: ['wayside'],
  // P1 arrival (Doctrine v2) — the P2/P3 spine lands below it (BRIDGE_STEP).
  openings: {
    wayside: '{name} reaches the river crossing near {location}.',
  },
  locationSubtypes: expandSettings(['wayside']),
  // THR-1165 — casts the toll keeper, so the mark on her lands on her.
  supportBundle: BRIDGE_SUPPORT_BUNDLE,
  traitVariants: [
    {
      // Being True, they will not pretend the bridge is better than it looks —
      // and an honest eye on bad planking is worth more than a brave one.
      traitId: 'trait.core.core_integrity.virtue',
      forecastDelta: 0.04,
      factorLine: 'Being True, they judge the boards as they are.',
    },
  ],
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      // THR-1153 — the `PATH · THE RIVER CROSSING` chip that stood here is
      // **folded**, not re-pointed. Its words survive in this overview; the chip
      // is gone.
      //
      // Christian's ruling (2026-08-17) set the bar at *anchoring*, not
      // reachability: a chip's referent must be an existing graph object,
      // resolvable in the live world the player is in, and the prose must name
      // that particular object. This chip's referents — "the river crossing",
      // "the ford upstream" — are landscape fiction. The template registers at
      // `wayside`, which expands to `camp | oasis | wilderness`, so it spawns on
      // hexes that in all likelihood carry no river at all.
      //
      // The ruling allowed one alternative: bind the spawn envelope to hexes
      // that really carry the feature. Measured, that is not cheap. `hasRiver`
      // is real, queryable world state (`src/types/index.ts`), but the setting
      // envelope is a *location-subtype* vocabulary end to end —
      // `SETTING_CLASS_MAP` expands a class to `LocationSubtype[]` and
      // `encounterCache` filters on exactly that. Binding would mean a new
      // hex-feature gating axis through the registration path, which is a design
      // change and not this ticket's. So: fold.
      overview:
        'The river keeps moving under the bridge, and the keeper keeps taking coppers. ' +
        'Neither can do it forever. They know what the crossing is worth now — the ford ' +
        'upstream is a real option, not a rumour.',
      changes: [],
      reactions: [
        {
          id: 'slice.bridge.walk_on',
          label: 'Walk on',
          intent: 'The road goes on from either bank.',
          effects: [
            // The keeper takes coppers for planking her own sons will not look
            // at. That is a concealed action, and a mark is what makes it
            // discoverable later instead of a detail only the prose knows.
            //
            // This one survives the THR-1153 fold because it anchors to a real
            // graph object: `$cast:bridge_keeper` is a cast actor the template
            // declares and the world instantiates. The `intelligence` record that sat
            // beside it did not — it filed knowledge about the ford, and the ford
            // is nowhere in the game state. THR-1141 added it to back the chip
            // that is now folded, so it leaves with the claim it existed to
            // support.
            {
              kind: 'hidden_mark',
              category: 'concealed_action',
              severity: 0.4,
              label: 'Takes a toll on planking she knows is failing',
              // THR-1165: was `$cast:keeper`. The comment above claimed the
              // template declared that key; it did not — `keeper` arrived from
              // the inherited `wayside` default as a bind-only hermit, so this
              // mark landed on scenery when it landed at all.
              // `investigation` only. `wayside` is a *setting class*, not a
              // template-id prefix — reveal families match by id prefix, so
              // naming it would have made this mark unrevealable by
              // construction (caught by `revealFamilyLiveness.test.ts`).
              targetAgentId: '$cast:bridge_keeper',
              revealFamilies: ['investigation'],
            },
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          // THR-1130 — `slice.bridge.read_the_boards` folded, not re-pointed.
          // It reported a `reputation_tally`, which has no player surface (Law
          // 13 parity): the effect below still fires and still counts toward the
          // threshold traits, but the number never speaks to the player, so the
          // chip named a quantity nobody could look up. Its last sentence is now
          // the overview's, where it is scene texture rather than a claim.
          overview:
            'They read the boards and crossed as if the bridge were ten years younger. The ' +
            'keeper’s sons watched the whole crossing from the near post, and neither has ' +
            'looked at their mother’s strongbox the same way since. The story reaches the ' +
            'next inn before they do.',
          changes: [
            {
              id: 'slice.bridge.steady_hands',
              kind: 'trait',
              title: 'Steady Hands',
              causeClause: 'They crossed a failing span without once reaching for the rail',
              detail: 'They walk off the far bank certain of their own footing, and it shows for a while.',
              polarity: 'gain',
              category: 'boon',
              direction: 'gain',
              stateNoun: { text: 'inspired', entityId: 'trait.condition.inspired', visualKind: 'attachment' },
              concepts: [{ text: 'certain of their own footing' }],
            },
          ],
          reactions: [
            {
              id: 'slice.bridge.walk_on_named',
              label: 'Walk on',
              intent: 'The road goes on, and this stretch of it knows the name now.',
              effects: [
                {
                  kind: 'reputation_tally',
                  key: SLICE_ROAD_REPUTE_KEY,
                  delta: SLICE_REPUTE_GAIN,
                },
                { kind: 'condition_attachment', templateId: 'trait.condition.inspired' },
              ],
            },
          ],
        },
        success_at_cost: {
          // THR-1130 — `slice.bridge.a_plank_short` folded (Law 13 parity; see
          // the critical_success note above). Its sentence is the last one here.
          overview:
            'They reach the far bank. Behind them a plank goes end over end into the river, ' +
            'and the keeper does not turn to watch it go. Tomorrow the toll is the same two ' +
            'coppers, for a bridge with one plank fewer. The keeper knows whose weight took ' +
            'it, and tells everyone who pays after.',
          changes: [],
          reactions: [
            {
              id: 'slice.bridge.walk_on_owing',
              label: 'Walk on',
              intent: 'The far bank is reached. The bridge is worse for it, and the keeper is counting.',
              effects: [
                {
                  kind: 'reputation_tally',
                  key: SLICE_ROAD_REPUTE_KEY_ILL,
                  delta: SLICE_REPUTE_LOSS,
                },
              ],
            },
          ],
        },
        failure: {
          overview:
            'The middle span refused their weight. The ford is half a day upstream and wet ' +
            'the whole way, and they make the far side after dark, with a pack that has been ' +
            'in the river and legs that have been in it longer.',
          changes: [
            {
              id: 'slice.bridge.the_long_ford',
              kind: 'trait',
              title: 'Ford-Worn',
              causeClause:
                'The middle span refused them and the ford upstream took the rest of the daylight',
              detail:
                'They come out of the river wrung out. The legs will do tomorrow’s road, and complain about every mile of it.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              stateNoun: { text: 'exhausted', entityId: 'trait.condition.exhausted', visualKind: 'attachment' },
              concepts: [{ text: 'wrung out' }],
            },
          ],
          reactions: [
            {
              id: 'slice.bridge.dry_out',
              label: 'Dry out and go on',
              intent: 'Wet boots walk. They just walk slower.',
              effects: [
                { kind: 'condition_attachment', templateId: 'trait.condition.exhausted' },
              ],
            },
          ],
        },
        critical_failure: {
          overview:
            'The beam gave out mid-stride, and the river took them before anyone could ' +
            'shout. The keeper’s sons pulled them out downstream without being asked — the ' +
            'one honest piece of work done at that bridge all day.',
          changes: [
            {
              id: 'slice.bridge.the_fall',
              kind: 'trait',
              title: 'The Fall',
              causeClause: 'The beam gave out mid-stride and the river pulled them under',
              detail: 'The leg holds. It will have opinions about stairs for a long while.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              // THR-1120 — the state noun declares the attachment this band's
              // reaction grants, so the chip can link it. The producer says what
              // it named (Law 2); matching 'wounded' against the reaction's
              // `trait.condition.wounded` by English would be the guess that law
              // forbids. `entityId` is the **template** id: the grant is written
              // when the player picks, and the veil closes on the pick, so the
              // instance does not exist while the chip is on screen.
              stateNoun: { text: 'wounded', entityId: 'trait.condition.wounded', visualKind: 'attachment' },
              concepts: [{ text: 'The leg' }],
            },
            {
              id: 'slice.bridge.the_water_underneath',
              kind: 'trait',
              title: 'What Was Under the Boards',
              causeClause: 'They went under once. The river decided when they came up, and they know it',
              detail: 'Deep water gets a wide berth from them now. They will add miles to a road before they trust a crossing again.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              stateNoun: { text: 'terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' },
              concepts: [{ text: 'Deep water' }],
            },
          ],
          reactions: [
            {
              id: 'slice.bridge.limp_on',
              label: 'Limp on',
              intent: 'The road goes on. It just goes on slower, and from the near bank.',
              effects: [
                { kind: 'condition_attachment', templateId: 'trait.condition.wounded' },
                { kind: 'condition_attachment', templateId: 'trait.condition.terrified' },
              ],
            },
          ],
        },
      },
    },
  },
  narrativeTemplates: {
    initiation:
      'The road meets the river at a bridge that has seen better decades, and the toll is ' +
      'cheaper than the detour.',
    success: 'The bridge held, and the road goes on from the far bank.',
    failure: 'The bridge could not be trusted, and the long ford cost the rest of the day.',
  },
  description:
    'A failing toll bridge stands on the only crossing within a day’s walk, and the family ' +
    'that keeps it swears it will hold. The traveler weighs a cheap crossing against a long ' +
    'ford, and a god can lean on that confidence either way.',
};

// ═════════════════════════════════════════════════════════════════════
// 2. SNOW ON THE PASS — Test & Consequence (Hook: original)
// ═════════════════════════════════════════════════════════════════════
//
// Crux: snow is coming to the pass, and the traveler is on the wrong side of it.
// Shape: Test & Consequence · Setting: wayside · Pressure: weather · Form:
// endure · Objective: survive · Stakes: no-penalty (a bad night costs
// exhaustion; a terrible one costs days) · System: movement + carryover +
// conditions + items · Steps: Stone "Beat the snow" → Stone "Pass the night",
// tilted by the carryover (THR-892 carryoverFactorLines — the slice's live use).
// Connected systems (Q8): carryover, conditions ×2 (incl. a Balm target),
// equipment (boots/cloak derived lines), cards — 4 beyond the core test.
// Choice: none. Promise→payoff: the lowering sky delivers the storm; the
// night is the consequence.

const PASS_CLIMB_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared strength family, the common option.
    id: 'slice.pass.second_wind',
    name: 'Find the Reserve',
    essenceCost: 1,
    forecastDelta: 0.1,
    imageTag: 'generic.strength',
    effectLine: 'When the legs go dead on the switchbacks, the body has one more climb in it.',
    bandProse: {
      success: 'The last switchback went by on legs that had no right to it.',
      failure: 'There was one more climb in them. The mountain asked for two.',
    },
  },
  {
    // Type: Boost — life, warmth held in the blood.
    id: 'slice.pass.warm_blood',
    name: 'Warm the Blood',
    sphere: 'life',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.warmth',
    effectLine: 'The heat stays in their hands and feet, so the cold cannot slow the climb before the snow does.',
    bandProse: {
      success_at_cost: 'The heat held to the saddle. It spent them to their last dry layer doing it.',
      near_miss: 'The heat got them high and fast, and the snow was faster.',
    },
  },
  {
    // Type: Boost — force, the wind turned aside.
    id: 'slice.pass.break_the_wind',
    name: 'Break the Wind',
    sphere: 'force',
    essenceCost: 2,
    forecastDelta: 0.09,
    imageTag: 'generic.strength',
    effectLine: 'Blunt the northern gusts on the exposed stretches, so the climb spends its strength on climbing.',
    bandProse: {
      critical_success: 'The wind stood off the whole climb, and the saddle came early.',
      failure: 'The wind was held. The light was not, and the last stretch went dark.',
    },
  },
  {
    // Type: Boost — light, the day stretched thin.
    id: 'slice.pass.last_light',
    name: 'Hold the Light',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.light',
    effectLine: 'The grey dusk lasts past its hour, and the trail stays readable to the top.',
    bandProse: {
      near_miss: 'The light lasted. The trail under it was already filling in.',
      critical_failure: 'The light held long enough to show exactly how far below the saddle the snow caught them.',
    },
  },
  {
    // Type: Boost — time, a pace that does not break.
    id: 'slice.pass.even_pace',
    name: 'Settle the Stride',
    sphere: 'time',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.time-slow',
    effectLine: 'Their pace locks to a climber’s clock, and the slope is spent evenly instead of in bursts.',
    bandProse: {
      success: 'The pace never broke, and the saddle arrived on schedule.',
      failure: 'The pace was right for a longer day than this one turned out to be.',
    },
  },
];

const PASS_NIGHT_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared focus family, the common option.
    id: 'slice.pass.steady_breath',
    name: 'Steady Breath',
    essenceCost: 1,
    forecastDelta: 0.05,
    imageTag: 'generic.focus',
    effectLine: 'The fear slows, and the night is spent on staying warm instead of worrying.',
    bandProse: {
      failure: 'The nerve held all night. The wood did not.',
    },
  },
  {
    // Type: Boost — energy, the fire that will not quit.
    id: 'slice.pass.banked_heat',
    name: 'Feed the Coals',
    sphere: 'energy',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.energy',
    effectLine: 'The fire holds a red heart through the worst hour of the night.',
    bandProse: {
      success: 'The fire held a red heart all night, and it was still there at morning.',
      failure: 'The fire stayed alive. The night was longer than the woodpile.',
    },
  },
  {
    // Type: Balm — life; the day's exhaustion lifted before the night tests it.
    id: 'slice.pass.deep_rest',
    name: 'Banish Weariness',
    sphere: 'life',
    essenceCost: 2,
    forecastDelta: 0.06,
    imageTag: 'generic.vigor',
    grants: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.exhausted' }],
    effectLine: 'The climb’s tiredness lifts, and the night starts on a rested body.',
    bandProse: {
      near_miss: 'The rest was real. The cold that followed it was more real.',
    },
  },
  {
    // Type: Boost — matter, shelter made stubborn.
    id: 'slice.pass.iron_patience',
    name: 'Stiffen the Shelter',
    sphere: 'matter',
    essenceCost: 2,
    forecastDelta: 0.07,
    imageTag: 'generic.matter',
    effectLine: 'Whatever stands between them and the wind holds its shape till dawn.',
    bandProse: {
      success_at_cost: 'The windbreak held its shape. Holding it cost the night’s sleep in repairs.',
      critical_failure: 'The windbreak held until the storm found its second strength, and then it did not.',
    },
  },
  {
    // Type: Boost — darkness, the night made a blanket instead of a threat.
    id: 'slice.pass.quiet_dark',
    name: 'Quiet the Dark',
    sphere: 'darkness',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.dark',
    effectLine: 'Nothing moves near the camp, and nothing in the night costs them sleep or nerve.',
    bandProse: {
      critical_success: 'The night passed without one alarm, and dawn came mild.',
      failure: 'The night stayed calm. The cold did all the damage.',
    },
  },
];

const PASS_CLIMB_STEP: ActionStep = {
  reach: 'stone',
  duration: { min: 1, max: 2 },
  difficulty: 0.42,
  purposeLine: 'Beat the snow',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  // The P2+P3 spine (Doctrine v2). The per-class P1 arrival lands above this
  // at instantiation.
  narrativeTemplate:
    'Snow is coming down onto the pass, and the wind has turned north. A shelter hut with a roof, a hearth ' +
    'and stacked wood sits just under the saddle, half a day up the switchbacks.\n\n' +
    'The snow reaches the pass by dark. Beat it to the hut, or spend the night on the open slope.',
  successAfterimage: 'They made the saddle ahead of the snow, and the hut door shut behind them.',
  failureAfterimage: 'The snow caught them below the saddle, and the night would be spent in the open.',
  successAtCostAfterimage: 'They reached the hut spent to the bone, the first drifts at their heels.',
  criticalSuccessAfterimage: 'They beat the storm with light to spare and wood already split.',
  criticalFailureAfterimage: 'The storm came down the slope to meet them, and the climb ended where it stood.',
  nudges: PASS_CLIMB_HAND,
};

const PASS_NIGHT_STEP: ActionStep = {
  reach: 'stone',
  duration: { min: 1, max: 2 },
  difficulty: 0.38,
  purposeLine: 'Pass the night',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  // THR-892 carryover lines — the variance rule's one authored factor surface
  // besides trait lines. The night reads how the climb went.
  carryoverFactorLines: {
    critical_success: {
      text: 'The hut is warm, the wood dry, the storm outside.',
      polarity: 'for',
      forecastDelta: 0.08,
    },
    success: {
      text: 'A roof and a hearth stand between them and the snow.',
      polarity: 'for',
      forecastDelta: 0.06,
    },
    success_at_cost: {
      text: 'The hut holds them, but the climb took their last dry strength.',
      polarity: 'for',
      forecastDelta: 0.02,
    },
    near_miss: {
      text: 'They came up short of the saddle and camped in the scrub.',
      polarity: 'against',
    },
    failure: {
      text: 'The night finds them on open slope with wet kindling.',
      polarity: 'against',
      forecastDelta: -0.06,
    },
    critical_failure: {
      text: 'The storm broke over them mid-climb, and camp is wherever they fell.',
      polarity: 'against',
      forecastDelta: -0.1,
    },
  },
  narrativeTemplate:
    'The snow arrives and does not stop, and the wind takes the temperature down with the light. From here ' +
    'to morning the work is heat: making it, holding it, and not wasting it on fear.',
  successAfterimage: 'Morning came grey and quiet, and they walked down the far side stiff and whole.',
  failureAfterimage: 'The night took more than it gave back, and the morning legs knew it.',
  successAtCostAfterimage: 'They passed the night awake and paid for it in the next day’s miles.',
  criticalSuccessAfterimage: 'They slept warm through the worst of it and woke to a pass already clearing.',
  criticalFailureAfterimage: 'The storm held them two days, and the mountain fed them poorly the whole stay.',
  nudges: PASS_NIGHT_HAND,
};

export const SLICE_SNOW_ON_THE_PASS: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.pass,
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'Snow on the Pass',
  reach: 'stone',
  crudType: 'read',
  scale: 'local',
  steps: [PASS_CLIMB_STEP, PASS_NIGHT_STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  settings: ['wayside'],
  // P1 arrival (Doctrine v2) — the P2/P3 spine lands below it (PASS_CLIMB_STEP).
  openings: {
    wayside: '{name} climbs toward the high pass above {location}.',
  },
  locationSubtypes: expandSettings(['wayside']),
  traitVariants: [
    {
      // Hope reads the hut as reachable, and reachable things get reached.
      traitId: 'trait.core.core_hope.virtue',
      forecastDelta: 0.04,
      factorLine: 'Hopeful, they climb toward the hut and never the storm.',
    },
  ],
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The first snow is down, and the switchbacks behind them are filling in. Whatever the ' +
        'climb took out of them, they are not getting it back on the way down.',
      changes: [
        {
          id: 'slice.pass.the_season',
          kind: 'shell_state',
          title: 'The Season',
          causeClause: 'They came off the high ground with the first of the winter behind them',
          detail:
            'The far side of the mountain is theirs to walk. What they left on the near side stays there until spring.',
          polarity: 'info',
          category: 'path',
          direction: 'opens',
          stateNoun: { text: 'what they know of this pass now', entityId: '$actor', visualKind: 'agent' },
        },
      ],
      reactions: [
        {
          id: 'slice.pass.walk_down',
          label: 'Walk down the far side',
          intent: 'The road resumes below the snow line.',
          effects: [
            // Law 56 (THR-1141): 'The Season' claims the near side is shut until
            // spring. The omen is what makes the season real to the simulation —
            // it carries a duration and biases what the region turns up while it
            // holds. It is paired with the intelligence record deliberately: this
            // module classifies `emit_omen` as scene dressing for the Rewards
            // block, so the knowledge write is what the chip is backed by, and
            // the omen is what makes the claim true rather than merely known.
            {
              kind: 'emit_omen',
              category: 'seasonal',
              intensity: SLICE_PASS_SEASON_INTENSITY,
              durationTicks: SLICE_PASS_SEASON_DURATION_TICKS,
              narrativeHook:
                'The high pass is closed. Nothing crosses it until the thaw.',
              scope: { kind: 'global' },
            },
            {
              kind: 'intelligence',
              category: 'trade_route',
              label: 'The high pass, after the first snow',
              detail:
                'The near side is shut until spring. Anything left on it stays there, and the '
                + 'only way back is the long road around.',
              targetAgentId: '$actor',
              reliability: 0.9,
            },
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          // THR-1130 — `slice.pass.the_woodpile` folded (Law 13 parity: a
          // `reputation_tally` chip reports a quantity with no player surface).
          // The woodpile was already the overview's closing image, so the fold
          // costs the scene nothing.
          overview:
            'They beat the storm to the hut with light to spare, slept warm through the worst ' +
            'of it, and came out to a pass already clearing. They split more wood than they ' +
            'burned and stacked it dry by the hearth. The next traveler over the saddle will ' +
            'find it there, and will never know who to thank.',
          changes: [
            {
              id: 'slice.pass.a_night_that_held',
              kind: 'trait',
              title: 'A Night That Held',
              causeClause: 'They beat the storm to the hut with light to spare and slept through the worst of it',
              detail: 'They come down the far side rested — what the climb took, the fire and the roof gave back.',
              polarity: 'gain',
              category: 'boon',
              direction: 'gain',
              // Anchored to the carrier, not to `trait.condition.exhausted`:
              // this band *removes* the condition, and THR-1120's rule is that a
              // chip may only link an attachment its own band grants. Linking the
              // exhaustion here would open the page for a thing the mortal no
              // longer has — a live link telling the opposite of the sentence.
              stateNoun: {
                text: 'the weariness they carried up',
                entityId: '$actor',
                visualKind: 'agent',
              },
            },
          ],
          reactions: [
            {
              id: 'slice.pass.walk_down_rested',
              label: 'Walk down the far side',
              intent: 'The road resumes below the snow line, and they meet it with legs still under them.',
              effects: [
                { kind: 'remove_condition', conditionTraitId: 'trait.condition.exhausted' },
                {
                  kind: 'reputation_tally',
                  key: SLICE_ROAD_REPUTE_KEY,
                  delta: SLICE_REPUTE_GAIN,
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview:
            'The hut took them in with the first drifts at their heels and nothing dry left ' +
            'to give it. They got through the night without sleeping much of it. The far side ' +
            'starts tomorrow on legs that already did today.',
          changes: [
            {
              id: 'slice.pass.spent_to_the_bone',
              kind: 'trait',
              title: 'Spent',
              causeClause: 'The drifts were at their heels the whole climb and the hut had nothing dry left to give',
              detail: 'The descent starts owing — the climb already took what the far side was going to need.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              stateNoun: { text: 'exhausted', entityId: 'trait.condition.exhausted', visualKind: 'attachment' },
            },
          ],
          reactions: [
            {
              id: 'slice.pass.walk_down_spent',
              label: 'Walk down the far side',
              intent: 'The road resumes below the snow line, and it will feel every mile of it.',
              effects: [
                { kind: 'condition_attachment', templateId: 'trait.condition.exhausted' },
              ],
            },
          ],
        },
        failure: {
          overview:
            'The snow caught them below the saddle, and the night went to the work of heat: ' +
            'making it out of wet kindling, keeping it out of wind, and not spending what was ' +
            'left of it on fear. Morning came. The kindling was gone and the wind had not dropped.',
          changes: [
            {
              id: 'slice.pass.a_night_in_the_open',
              kind: 'trait',
              title: 'A Night in the Open',
              causeClause: 'The snow caught them below the saddle and the fire had to be made twice',
              detail: 'They walk down worn through, having burned every dry scrap they were carrying to see morning.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              stateNoun: { text: 'exhausted', entityId: 'trait.condition.exhausted', visualKind: 'attachment' },
            },
            {
              id: 'slice.pass.what_the_dark_took',
              kind: 'trait',
              title: 'What the Dark Took',
              causeClause:
                'They spent the night talking themselves out of being afraid, hour by hour',
              detail:
                'They come off the mountain less sure of themselves than they went up. It shows the '
                + 'next time a road offers them a choice.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              stateNoun: { text: 'the nerve they came down with', entityId: '$actor', visualKind: 'agent' },
            },
          ],
          reactions: [
            {
              id: 'slice.pass.walk_down_worn',
              label: 'Walk down the far side',
              intent: 'The road is below the snow line. They take it slowly.',
              effects: [
                { kind: 'condition_attachment', templateId: 'trait.condition.exhausted' },
                {
                  kind: 'quintessence_shift',
                  delta: SLICE_NERVE_EROSION,
                  source: 'slice.pass.a_night_in_the_open',
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview:
            'The storm came down the slope to meet them and the climb ended where it stood. ' +
            'The mountain held them two days on open ground and fed them poorly the whole ' +
            'stay. They came off it on the third morning, walking badly, with frost in both hands.',
          changes: [
            {
              id: 'slice.pass.the_mountain_kept_them',
              kind: 'trait',
              title: 'What the Mountain Kept',
              causeClause: 'The storm held them two days on open ground and fed them poorly the whole stay',
              detail: 'Frost got into the hands and the feet, and it will be weeks before either forgives them.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              stateNoun: { text: 'wounded', entityId: 'trait.condition.wounded', visualKind: 'attachment' },
            },
          ],
          reactions: [
            {
              id: 'slice.pass.come_down_hurt',
              label: 'Come down off it',
              intent: 'Get down to the road, slowly, on the feet that still work.',
              effects: [
                { kind: 'condition_attachment', templateId: 'trait.condition.wounded' },
                { kind: 'condition_attachment', templateId: 'trait.condition.exhausted' },
              ],
            },
          ],
        },
      },
    },
  },
  narrativeTemplates: {
    initiation: 'The pass is a half day up, and the weather is a half day behind.',
    success: 'They crossed ahead of the season and came down the far side whole.',
    failure: 'The mountain kept them longer than planned and charged for the stay.',
  },
  description:
    'A mountain pass with the weather closing in behind it, and a shelter somewhere ahead ' +
    'worth reaching first. Whatever the race costs is still owed when night falls, and the ' +
    'god can press the traveler toward speed, or toward shelter.',
};

// ═════════════════════════════════════════════════════════════════════
// 3. RIDERS BEHIND THE CARAVAN — Puzzle–Investigation–Resolution (Hook #207)
// ═════════════════════════════════════════════════════════════════════
//
// Crux: riders are trailing the traveler's caravan, hunting one of the
//       thirty — and they will take everyone to reach them.
// Shape: Puzzle–Investigation–Resolution · Setting: wayside · Pressure: fear ·
// Form: hunt · Objectives: the master protects; the hunted conceals; the
// agent must solve · Stakes: intel + no-penalty; a seed either way (v1: the
// close stays in-encounter; the chain slot is reserved) · System: cards +
// traits + movement; intel flagged middling.
// The clues live BEHIND the Eye gate: the bands of step 1 reveal them
// (who avoids the riders' side of the road, whose gear argues with their
// story, who overpays for silence) — the opening promises and does not tell.
// Why the agent: they joined the column last and knew no one in it before —
// scene-local fact of this journey, stated in the master's own dialogue.
// Connected systems (Q8): traits (variant + trait factor), conditions
// (terrified on a bad end), cards, movement — 3+ beyond the core test.
// Choice: none. Promise→payoff: who is hunted → step-1 bands; who hunts →
// step 2 and the aftermath.

const CARAVAN_FIND_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared focus family, the common option.
    id: 'slice.caravan.quiet_questions',
    name: 'Quiet Questions',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.focus',
    effectLine: 'Every asking lands as small talk, never as suspicion.',
    bandProse: {
      success: 'By the third fire, the column’s stories had come loose.',
      near_miss: 'The questions stayed gentle. One answer came back too smooth to trust.',
    },
  },
  {
    // Type: Boost — mind, the details lined up and compared.
    id: 'slice.caravan.old_lessons',
    name: 'Stir Memory',
    sphere: 'mind',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.memory',
    effectLine: 'Every road-story they have heard told wrong comes back, so the false one in this column stands out.',
    bandProse: {
      success_at_cost: 'The wrong story showed itself. So did the traveler’s interest in it.',
      failure: 'Every story in the column had a crack in it, and none of the cracks lined up.',
    },
  },
  {
    // Type: Gambit — chaos, this hand's ONE rider: shake the column and watch.
    id: 'slice.caravan.a_loose_tongue',
    name: 'Loosen a Tongue',
    sphere: 'chaos',
    essenceCost: 1,
    forecastDelta: 0.04,
    rider: 'all_or_nothing',
    imageTag: 'generic.luck',
    effectLine: 'One voice at the night fire runs free — the truth spills fast, or the hunt is tipped off. Nothing in between.',
    bandProse: {
      critical_success: 'The loose talk ran one direction all night, and it pooled around a single bedroll.',
      failure: 'The talk ran loose and useless, and by morning the column knew a question was loose in it.',
      critical_failure: 'The wrong ears caught the loose talk, and on the ridge the riders changed their pace.',
    },
  },
  {
    // Type: Boost — matter, what people carry telling on them.
    id: 'slice.caravan.marked_coin',
    name: 'Weigh the Gear',
    sphere: 'matter',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.matter',
    effectLine: 'What people carry tells on what they claim to be.',
    bandProse: {
      near_miss: 'One kit argued with its owner’s story. So, on a second look, did two others.',
      failure: 'Half the column owned one item too good for them. The trick pointed at all of it at once.',
    },
  },
  {
    // Type: Boost — time, the pattern across four days of road.
    id: 'slice.caravan.patient_watch',
    name: 'Hold the Pattern',
    sphere: 'time',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.time-slow',
    effectLine: 'All four days stay in view at once, and the one walker whose habits bend around the riders shows plain.',
    bandProse: {
      success: 'Across four days, one walker never once let the ridge see their face.',
      critical_failure: 'The pattern came clear a half day too late to matter.',
    },
  },
];

const CARAVAN_SLIP_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared focus family, the common option.
    id: 'slice.caravan.hushed_steps',
    name: 'Still the Camp',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.focus',
    effectLine: 'The leaving looks like an errand and sounds like sleep.',
    bandProse: {
      success: 'Two shapes left the camp at the hour when nobody counts shapes.',
      near_miss: 'The leaving was quiet. The dog that watched it leave was not.',
    },
  },
  {
    // Type: Boost — darkness, cover for the leaving.
    id: 'slice.caravan.thicken_the_dark',
    name: 'Thicken the Dark',
    sphere: 'darkness',
    essenceCost: 2,
    forecastDelta: 0.1,
    imageTag: 'generic.dark',
    effectLine: 'The night deepens between the fires and the treeline, and the going is a rumor even to the watch.',
    bandProse: {
      critical_success: 'The dark held them the whole distance, and the morning count came up one short with no story attached.',
      failure: 'The dark covered the leaving. It covered the ditch as well.',
    },
  },
  {
    // Type: Boost — mind, the story that survives the morning after.
    id: 'slice.caravan.a_plain_story',
    name: 'Seed the Story',
    sphere: 'mind',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.memory',
    effectLine: 'A dull, sensible reason for the empty bedroll takes root, and the morning asks no questions worth carrying.',
    bandProse: {
      success_at_cost: 'The story held with the column. Holding it cost the master a debt he will remember.',
      failure: 'The story was plain. The empty bedroll was plainer.',
    },
  },
  {
    // Type: Insurance — order, this hand's ONE rider: the leaving is bought.
    id: 'slice.caravan.safe_passage',
    name: 'Bind Outcome',
    sphere: 'order',
    essenceCost: 3,
    forecastDelta: 0.05,
    rider: 'floor_at_cost',
    imageTag: 'generic.ward',
    effectLine: 'However the night goes, the hunted one is out of the column by morning. The price, if it comes due, is paid in noise and hours.',
    bandProse: {
      success_at_cost: 'They got clear because two routes out had been readied. Taking the second one woke half the camp.',
      critical_failure: 'The route out held. What it opened onto had riders already on it.',
    },
  },
  {
    // Type: Boost — spirit, two nerves held as one.
    id: 'slice.caravan.one_heartbeat',
    name: 'Tie the Nerves',
    sphere: 'spirit',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.oath',
    effectLine: 'The traveler and the hunted one hold each other level — neither can panic alone.',
    bandProse: {
      near_miss: 'Neither of them broke. The horse they had counted on did.',
      failure: 'The nerve held in both of them right up to the open ground.',
    },
  },
];

const CARAVAN_FIND_STEP: ActionStep = {
  reach: 'eye',
  duration: { min: 1, max: 2 },
  difficulty: 0.4,
  purposeLine: 'Find the hunted',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  // The P2+P3 spine (Doctrine v2). The per-class P1 arrival lands above this
  // at instantiation. The caravan master is introduced here by cast token.
  narrativeTemplate:
    'Two riders have followed the caravan since noon, keeping pace and keeping their distance. The caravan ' +
    'master, {cast:caravan_master}, says one of his thirty walkers is being hunted, and the traveler — last ' +
    'to join, a stranger to every face — is the one walker he can rule out.\n\n' +
    'He wants the hunted one found before the town gates, four days on, without the column knowing it is ' +
    'being weighed.',
  successAfterimage: 'By the third night fire, the traveler knew which bedroll the riders were waiting on.',
  failureAfterimage: 'Four days of watching bought suspicions, and the gates arrived before certainty did.',
  successAtCostAfterimage: 'The name came clear, and so did a rumor that questions were being asked.',
  criticalSuccessAfterimage: 'The traveler found the hunted one early, and found them ready to talk.',
  criticalFailureAfterimage: 'The watching was noticed, and the column began watching back.',
  nudges: CARAVAN_FIND_HAND,
};

const CARAVAN_SLIP_STEP: ActionStep = {
  reach: 'shadow',
  duration: { min: 1, max: 2 },
  difficulty: 0.42,
  purposeLine: 'Slip them out',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  carryoverFactorLines: {
    critical_success: {
      text: 'The hunted one trusts the traveler and moves on their word.',
      polarity: 'for',
      forecastDelta: 0.06,
    },
    success: {
      text: 'The right name is known, and the leaving can be planned.',
      polarity: 'for',
      forecastDelta: 0.04,
    },
    near_miss: {
      text: 'The name is a strong guess, and guesses leave at night too.',
      polarity: 'against',
    },
    failure: {
      text: 'No certain name — the plan protects a hope, not a person.',
      polarity: 'against',
      forecastDelta: -0.05,
    },
    critical_failure: {
      text: 'The column is wary now, and wary camps sleep lightly.',
      polarity: 'against',
      forecastDelta: -0.08,
    },
  },
  narrativeTemplate:
    'This is the last camp before the gates. Whoever leaves the column has to leave tonight, quietly, and ' +
    'in a direction the riders are not watching.',
  successAfterimage: 'The morning count came up one short, and the column walked through the gates unbothered.',
  failureAfterimage: 'The leaving failed, and the column reached the gates with the riders still choosing their hour.',
  successAtCostAfterimage: 'The hunted one got clear, and the noise of it will be paid for in the town.',
  criticalSuccessAfterimage: 'By dawn the hunted one was a day gone on a road with no watchers, and the riders were following a cart that mattered to no one.',
  criticalFailureAfterimage: 'The riders came down off the ridge at the worst hour, and the camp woke to shouting.',
  nudges: CARAVAN_SLIP_HAND,
};

/**
 * The man who walks at the front of the column and decides who travels with it.
 *
 * THR-1165: the `bond_change` below used to aim at `$cast:keeper` — the inherited
 * `wayside` hermit — so the bond the ending describes ("thirty people can name the
 * stranger who walked them in") was either written onto a roadside hermit with no
 * connection to the column, or, far more often, onto nobody at all. The caravan
 * master is the party to that bond, so the scene casts him.
 */
const CARAVAN_MASTER_SPEC: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'caravan_master',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  supportRole: 'caravan_master',
  spawnNpcRole: 'merchant',
  spawnName: 'The Caravan Master',
};

/** Composed, not replaced — same reasoning as {@link CROSSROADS_SUPPORT_BUNDLE}. */
const CARAVAN_SUPPORT_BUNDLE: EncounterSupportBundle = [
  ...DEFAULT_SETTING_SUPPORT_BUNDLES.wayside,
  CARAVAN_MASTER_SPEC,
];

export const SLICE_RIDERS_BEHIND_CARAVAN: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.caravan,
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'Riders Behind the Caravan',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',
  steps: [CARAVAN_FIND_STEP, CARAVAN_SLIP_STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['revelation_discretion', 'sacrifice_survival'],
  settings: ['wayside'],
  // P1 arrival (Doctrine v2) — the P2/P3 spine lands below it (CARAVAN_FIND_STEP).
  openings: {
    wayside: '{name} walks with a caravan on the road to {location}.',
  },
  locationSubtypes: expandSettings(['wayside']),
  // THR-1165 — casts the caravan master, so the bond the ending describes binds
  // the man who asked rather than the wayside default's ambient hermit.
  supportBundle: CARAVAN_SUPPORT_BUNDLE,
  traitVariants: [
    {
      // Warmth opens doors that questions cannot.
      traitId: 'trait.core.core_warmth.virtue',
      forecastDelta: 0.05,
      factorLine: 'Warm company makes the column talk to them freely.',
    },
  ],
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The column goes in through the gates. The two riders come down off the ridge and ' +
        'follow it in at a walk, in no more hurry than they were four days ago.',
      changes: [
        {
          id: 'slice.caravan.the_column',
          kind: 'shell_state',
          title: 'The Column',
          causeClause: 'They walked four days inside a column that knew it was being hunted',
          detail:
            'The caravan roads are open to them now — thirty people can name the stranger who walked them in.',
          polarity: 'info',
          category: 'path',
          direction: 'opens',
          stateNoun: {
            text: 'what they know of the caravan roads',
            entityId: '$actor',
            visualKind: 'agent',
          },
        },
      ],
      reactions: [
        {
          id: 'slice.caravan.part_ways',
          label: 'Part ways at the gates',
          intent: 'The column scatters into the town, and the road resumes.',
          effects: [
            // Law 56 (THR-1141): 'The Column' claims thirty people can name the
            // stranger who walked them in. Being nameable is two real things —
            // an edge to the man who asked, and a standing on this road — so
            // both are written rather than described.
            {
              kind: 'bond_change',
              // THR-1165: was `$cast:keeper` — the inherited wayside hermit, not
              // the man who walks at the front of the column.
              withAgentId: '$cast:caravan_master',
              sentimentDelta: SLICE_CARAVAN_MASTER_SENTIMENT,
              trustDelta: SLICE_CARAVAN_MASTER_TRUST,
            },
            {
              kind: 'intelligence',
              category: 'trade_route',
              label: 'The caravan roads',
              detail:
                'Which column runs which chalk road, and who walks at the front of it. Thirty '
                + 'people can put a name to the stranger who walked them in.',
              targetAgentId: '$actor',
              reliability: 0.85,
            },
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          overview:
            'By dawn the hunted one was a day gone on a road with no watchers, and the riders ' +
            'were following a cart that mattered to no one. The master says nothing at the ' +
            'gates. He does not have to — twenty-nine people watched a bedroll stay empty and ' +
            'worked the rest out for themselves.',
          // THR-1130 — `slice.caravan.the_masters_word` deleted, not folded (Law
          // 13 parity). Deliberately *not* folded: its sentence claimed the
          // master "owes them a debt", and no effect on this band writes an
          // `owes_favor` edge, so moving those words into the overview would
          // relocate a false state claim rather than retire it (Law 56 clause 1).
          // The master's silence at the gates is already the overview's closing
          // beat, which is the part that actually happened.
          changes: [],
          reactions: [
            {
              id: 'slice.caravan.part_ways_owed',
              label: 'Part ways at the gates',
              intent: 'The column scatters into the town, carrying the story with it.',
              effects: [
                {
                  kind: 'reputation_tally',
                  key: SLICE_ROAD_REPUTE_KEY,
                  delta: SLICE_REPUTE_GAIN,
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview:
            'The hunted one got clear, and the getting clear made noise. Somebody in the ' +
            'column watched the traveler ask the questions, and somebody in the column will ' +
            'be asked questions of their own once the riders reach the gate.',
          changes: [
            {
              id: 'slice.caravan.a_face_remembered',
              kind: 'trait',
              title: 'A Face Remembered',
              causeClause:
                'Somebody in the column watched them ask the questions, and the riders reach the gate tomorrow',
              detail:
                'A walker in that column can point them out by face, and will, the first time the '
                + 'riders make it worth doing.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              stateNoun: { text: 'the face they showed the column', entityId: '$actor', visualKind: 'agent' },
            },
          ],
          reactions: [
            {
              id: 'slice.caravan.part_ways_marked',
              label: 'Part ways at the gates',
              intent: 'The column scatters into the town, and so does everyone who saw them asking.',
              effects: [
                {
                  kind: 'hidden_mark',
                  category: 'concealed_action',
                  severity: SLICE_CONCEALED_ACTION_SEVERITY,
                  label: 'Moved a hunted traveler out of a watched caravan',
                },
              ],
            },
          ],
        },
        failure: {
          overview:
            'Nobody left the column. The gates take all thirty in, the riders come down off ' +
            'the ridge at their leisure, and the hunted one walks to an inn they will not walk ' +
            'out of.',
          changes: [
            {
              id: 'slice.caravan.the_hunt_unbroken',
              kind: 'trait',
              title: 'The Hunt, Unbroken',
              causeClause:
                'They spent four days on the wrong questions and nobody left the column before the gates',
              detail:
                'They walk in through the gates knowing how this ends, and knowing they had four '
                + 'days to stop it.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              stateNoun: { text: 'the nerve they walked in with', entityId: '$actor', visualKind: 'agent' },
            },
          ],
          reactions: [
            {
              id: 'slice.caravan.walk_in_empty',
              label: 'Part ways at the gates',
              intent: 'The column scatters into the town, and the riders come down off the ridge at their leisure.',
              effects: [
                {
                  kind: 'quintessence_shift',
                  delta: SLICE_NERVE_EROSION,
                  source: 'slice.caravan.the_hunt_unbroken',
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview:
            'The riders came down at the worst hour and the camp woke to shouting. They took ' +
            'what they came for and put down what stood in the way. The column reached the ' +
            'gates in daylight, quiet, and shorter than it had been.',
          changes: [
            {
              id: 'slice.caravan.stood_in_the_way',
              kind: 'trait',
              title: 'Stood in the Way',
              causeClause:
                'The riders came down at the worst hour and were not careful about who stood between them and the cart',
              detail: 'They took the blow meant for the hunted one, and will carry it into the town and past it.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              stateNoun: { text: 'wounded', entityId: 'trait.condition.wounded', visualKind: 'attachment' },
            },
          ],
          reactions: [
            {
              id: 'slice.caravan.walk_in_hurt',
              label: 'Walk in with the rest',
              intent: 'The gates do not ask what happened at the river bend.',
              effects: [
                { kind: 'condition_attachment', templateId: 'trait.condition.wounded' },
              ],
            },
          ],
        },
      },
    },
  },
  narrativeTemplates: {
    initiation: 'Two riders have kept pace with the caravan since the river, and they are not lost.',
    success: 'The caravan reached the gates whole, and the hunt went home empty.',
    failure: 'The hunt closed on the column before the gates could.',
  },
  description:
    'Riders have shadowed a crowded column since the river, hunting one traveler among many. ' +
    'A god can tip the odds of moving the hunted out unseen, or leave the road to settle it ' +
    'at the gates.',
};

// ═════════════════════════════════════════════════════════════════════
// 4. A BARGAIN AT THE CROSSROADS — Personality Fork (Hook #206)
//    └─ seeds THE FULL MOON COLLECTION on the accept path
// ═════════════════════════════════════════════════════════════════════
//
// Crux: a stranger at the crossroads knows the traveler's name and offers a
//       gift that costs only a promise.
// Shape: Personality Fork on tradition↔novelty — positive (Archivist) keeps
// their word to themselves and walks on; negative (Heretic) gives the promise
// and takes the bargain · Setting: wayside · Pressure: ambition · Form:
// bargain · Objective: negotiate or refuse · Stakes: seed (the full-moon
// sequel) on accept; no-penalty on refusal · System: forks + seeds; the
// arcane is scene flavor only — no agent-magic mechanics.
// Personalization (Q8): the stranger greets by name (narrated; the name-token
// surface is the ticketed gap); the gift glimpse is authored generic in v1
// and keyed to the agent in the same ticket. Connected systems: forks, seeds,
// traits (variant), cards — 3+ beyond the core test.
// Promise→payoff: what the man is — deliberately deferred into the seeded
// sequel; the Eye step's bands give partial truth only.

/**
 * THR-1110 — the stranger is cast, not just narrated.
 *
 * An agreement is a claim *between* two parties, so the promise cannot be written
 * to the graph without someone standing on the other end of it. He also has to
 * outlive the scene: the accept path's seed already carries `inheritContext: true`,
 * whose whole purpose is to make the follow-up "star the same people" — and with no
 * support bundle there were no bindings to inherit, so The Full Moon Collection was
 * inheriting an empty cast while its prose says "The stranger is there before the
 * light finishes arriving, same coat, same clean boots." Casting him honours what
 * that seed was already written to do.
 *
 * `must-persist` for the same reason: a promise whose holder is garbage-collected
 * at scene end is not a promise. He reuses no existing NPC role — nothing already
 * in the world is this — and the spawn name keeps the register of the scene, which
 * never tells you what he is.
 */
const CROSSROADS_STRANGER_SPEC: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'stranger',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  supportRole: 'crossroads_stranger',
  spawnNpcRole: 'wanderer',
  spawnName: 'The Stranger at the Crossroads',
};

/**
 * Composed, not replaced. `withDefaultSupportBundle` returns early on any template
 * that declares a bundle of its own, so naming only the stranger would have
 * silently dropped the wayside setting-class default (THR-1044) this encounter has
 * been staged with — its ambient keeper and traveler. The stranger is appended
 * rather than prepended so the ambient cast keeps the binding order the rest of the
 * slice is staged and asserted against; he is the scene's subject, not its scenery,
 * and is addressed by key.
 */
const CROSSROADS_SUPPORT_BUNDLE: EncounterSupportBundle = [
  ...DEFAULT_SETTING_SUPPORT_BUNDLES.wayside,
  CROSSROADS_STRANGER_SPEC,
];

const CROSSROADS_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — common; the old tales as a measuring stick. Leans toward
    // keeping one's word to oneself (tradition).
    id: 'slice.crossroads.old_stories',
    name: 'Weigh the Tales',
    essenceCost: 1,
    forecastDelta: 0.06,
    poleLean: { axis: 'tradition_novelty', toward: 'positive' },
    imageTag: 'generic.memory',
    effectLine: 'Every fireside story about crossroads strangers stands beside the offer. It argues for walking on.',
    bandProse: {
      success: 'The tales lined up beside the stranger, and the fit was close enough to notice.',
      near_miss: 'The tales said walk on. The named gift said the tales had never been this specific.',
    },
  },
  {
    // Type: Boost — mind, reading the man as a man.
    id: 'slice.crossroads.second_sight',
    name: 'Sharpen the Read',
    sphere: 'mind',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.focus',
    effectLine: 'The hands, the coat, the patience — whatever he is, less of it stays hidden.',
    bandProse: {
      success: 'The read came back strange and shallow at once: fine boots that had walked no road, patience with no fidget in it.',
      failure: 'The read slid off him like water off wax.',
    },
  },
  {
    // Type: Kindled Ambition — spirit; the wanting itself, examined. Leans
    // toward taking the bargain (novelty).
    id: 'slice.crossroads.a_taste_for_wonders',
    name: 'Fan the Wanting',
    sphere: 'spirit',
    essenceCost: 1,
    forecastDelta: 0.07,
    poleLean: { axis: 'tradition_novelty', toward: 'negative' },
    imageTag: 'generic.energy',
    effectLine: 'The hunger the stranger named burns plain, so the choice is made with open eyes. It argues for the bargain.',
    bandProse: {
      near_miss: 'The wanting stood up honestly, and honesty made it harder, not easier.',
      failure: 'The wanting grew loud enough to drown the part of the read that mattered.',
    },
  },
  {
    // Type: Boost — time; what the full moon means, counted forward.
    id: 'slice.crossroads.cold_reading',
    name: 'Tally the Days',
    sphere: 'time',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.memory',
    effectLine: 'The promise is counted forward to the full moon, so the price is measured in something real.',
    bandProse: {
      critical_success: 'The whole bargain unfolded like a route on a map: the gift, the moon, the walk back, the standing still.',
      failure: 'The days counted forward cleanly, and stopped counting at the full moon like a road stopping at a cliff.',
    },
  },
  {
    // Type: Boost — light; the plain look that embarrasses glamours.
    id: 'slice.crossroads.truthful_air',
    name: 'Clear the Air',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.07,
    imageTag: 'generic.light',
    effectLine: 'What stands at the crossroads is seen in honest light, whatever it is.',
    bandProse: {
      success_at_cost: 'The honest light showed a man-shaped patience, and showed the traveler how long it had been standing there.',
      critical_failure: 'The air cleared, and for one look there was slightly too much crossroads and slightly too little man.',
    },
  },
];

const CROSSROADS_MEASURE_STEP: ActionStep = {
  reach: 'eye',
  duration: { min: 1, max: 1 },
  difficulty: 0.35,
  purposeLine: 'Take his measure',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  // The P2+P3 spine (Doctrine v2). The per-class P1 arrival lands above this
  // at instantiation. The stranger is introduced here by cast token.
  narrativeTemplate:
    'A stranger, {cast:stranger}, waits under the dead tree — no horse, no pack, no mud on his boots. He ' +
    'greets the traveler by name, offers a gift shaped to their own quiet wanting, and asks in payment only ' +
    'a promise: collect it here at the next full moon.\n\n' +
    'Take the measure of a man who knows too much, then give the word or keep walking.',
  successAfterimage: 'The traveler took the stranger’s measure and kept their own counsel about it.',
  failureAfterimage: 'The stranger was easy to look at and impossible to read, and gave back only manners.',
  successAtCostAfterimage: 'The reading told them truths they would have preferred to learn from further away.',
  criticalSuccessAfterimage: 'For one clear look, the traveler saw the shape of the bargain whole.',
  criticalFailureAfterimage: 'The look went wrong behind the eyes, and they came away knowing less than when they started.',
  nudges: CROSSROADS_HAND,
};

/** Accept path — the promise given; the full moon is now a fact of the calendar. */
const CROSSROADS_ACCEPT_STEP: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 1 },
  difficulty: 0.2,
  purposeLine: 'Give the word',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The word is out fast, and it stays out. The stranger accepts it with a nod, as if ' +
    'signing for a delivery, and steps back under the dead tree. “The moon will find ' +
    'you,” he says. “It is better at that than I am.”',
  successAfterimage: 'The promise was given plainly, and the stranger treated it like currency.',
  failureAfterimage: 'The word came out hedged, and the stranger accepted the hedge with a smile that said it did not matter.',
  successAtCostAfterimage: 'The promise was given, and giving it cost a night’s easy sleep.',
  criticalSuccessAfterimage: 'The word was given clean, and the stranger repeated it back to them once, exactly.',
  criticalFailureAfterimage: 'The promise left the traveler’s mouth and did not feel like theirs anymore.',
};

/** Refuse path — the word kept; the road taken. */
const CROSSROADS_REFUSE_STEP: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 1 },
  difficulty: 0.2,
  purposeLine: 'Keep the word',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The traveler says no and keeps walking. The stranger does not follow ' +
    'and does not frown. “A careful answer,” he says behind them, in the voice of a ' +
    'man closing a shop for the evening. The crossroads drops behind them at the treeline like any other stretch of road.',
  successAfterimage: 'They walked on with their word unspent, and the road stayed ordinary.',
  failureAfterimage: 'They walked on, and the offer walked with them for a mile or two before it faded.',
  successAtCostAfterimage: 'They refused him plainly, and spent the evening rehearsing the refusal.',
  criticalSuccessAfterimage: 'The refusal cost them not one copper, and the stranger did not argue it even once.',
  criticalFailureAfterimage: 'They refused, and the wanting he had named kept them company far past the treeline.',
};

const CROSSROADS_FORK: ActionStepBranch = {
  branchOnStep: 0,
  decidedBy: { axis: 'tradition_novelty' },
  variants: {
    positive: CROSSROADS_REFUSE_STEP,
    negative: CROSSROADS_ACCEPT_STEP,
  },
  fallback: CROSSROADS_REFUSE_STEP,
};

export const SLICE_BARGAIN_AT_CROSSROADS: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.crossroads,
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'A Bargain at the Crossroads',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',
  steps: [CROSSROADS_MEASURE_STEP, CROSSROADS_FORK],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['tradition_novelty'],
  settings: ['wayside'],
  // P1 arrival (Doctrine v2) — the P2/P3 spine lands below it
  // (CROSSROADS_MEASURE_STEP).
  openings: {
    wayside: '{name} comes to the crossroads at {location} at dusk.',
  },
  locationSubtypes: expandSettings(['wayside']),
  // THR-1110 — casts the stranger so the promise has a second party to bind to,
  // and so the accept path's `inheritContext: true` has bindings to carry into
  // The Full Moon Collection.
  supportBundle: CROSSROADS_SUPPORT_BUNDLE,
  traitVariants: [
    {
      // A True mortal treats a promise as a real object before giving one away.
      traitId: 'trait.core.core_integrity.virtue',
      forecastDelta: 0.04,
      factorLine: 'Being True, they weigh the promise as carefully as the gift.',
    },
  ],
  aftermathConfig: {
    // The *deciding* step, not the fork's own index (THR-979). CROSSROADS_FORK
    // sits at index 1 but declares `branchOnStep: 0`, and the engine records the
    // decision against the step that resolved — index 0. Naming 1 here read a
    // step no choice is ever written to, so both endings below were unreachable
    // and the Full Moon seed was never planted.
    branchOnStep: 0,
    variants: {
      negative: {
        // The accept path's bands deliberately override `overview` + `changes`
        // only. A band that authored `reactions` would replace this one — and
        // with it the Full Moon seed, which is the whole point of the path.
        overview:
          'The bargain is struck. The stranger steps back under the dead tree and is gone ' +
          'before they finish turning, and the full moon is already on the calendar.',
        changes: [
          {
            id: 'slice.crossroads.the_word_given',
            kind: 'trait',
            title: 'The Word Given',
            causeClause: 'They said yes under the dead tree, out loud, with the stranger counting',
            detail: 'A stranger holds a claim on them now, and it falls due when the moon is full.',
            // BOND, not SCAR. A promise given is not an injury — it is someone
            // standing on the other end of a claim. (`polarity: 'info'` predates
            // the explicit `category` and is kept: the bands that genuinely cost
            // something — the night's sleep, the word that stopped being theirs —
            // keep `loss`.)
            polarity: 'info',
            category: 'bond',
            direction: 'loss',
            // THR-1110 — the noun now names a thing the bearer actually holds: the
            // `agreement.bargain.promise_given` edge the reaction below writes. It
            // took a `tooltipId` rather than a `visualKind` because an agreement has
            // no art, and the type's rule is that a concept with no tile takes a
            // tooltip instead of a wrong one.
            stateNoun: { text: 'the promise at the crossroads', tooltipId: 'ui.agreement' },
            concepts: [{ text: 'a claim', tooltipId: 'ui.agreement' }],
          },
        ],
        reactions: [
          {
            id: 'slice.crossroads.carry_the_promise',
            label: 'Carry the promise',
            intent: 'The road goes on, with an appointment at the end of it.',
            effects: [
              {
                // THR-1110 — the promise is a real claim the bearer holds, not only
                // a scheduled encounter. Before the `attachment_grant` member existed
                // the seed below was the sole durable write, so nothing read the bond,
                // nothing gated on it, and it could not be inspected on the bearer.
                // Both writes ride the base reaction deliberately: the bands on this
                // path author `overview` + `changes` only, because
                // `applyAftermathOutcomeBand` replaces reactions wholesale and a band
                // that authored its own would drop everything here.
                kind: 'attachment_grant',
                templateId: 'agreement.bargain.promise_given',
                targetAgentId: '$actor',
                counterpartyId: '$cast:stranger',
                // The bond falls due exactly when the collection does.
                durationOverride: SLICE_FULL_MOON_DELAY_TICKS,
              },
              {
                kind: 'encounter_seed',
                templateId: SLICE_TEMPLATE_IDS.fullMoon,
                targetAgentId: '$actor',
                delayTicks: SLICE_FULL_MOON_DELAY_TICKS,
                seedLabel: 'A promise made at the crossroads falls due at the full moon.',
                inheritContext: true,
              },
            ],
          },
        ],
        byOutcome: {
          critical_success: {
            overview:
              'The word went out clean, with nothing hedged and nothing hidden behind it. ' +
              'He was pleased. Whatever he is, he is the kind of thing that can be pleased ' +
              'by a plain answer.',
            changes: [
              {
                id: 'slice.crossroads.given_clean',
                kind: 'trait',
                title: 'Given Clean',
                causeClause: 'They answered plainly, hedged nothing, and he was pleased by a plain answer',
                detail: 'The claim on them is exactly the size of what they said aloud, and not one word wider.',
                polarity: 'info',
                category: 'bond',
                direction: 'loss',
                stateNoun: { text: 'the promise at the crossroads', tooltipId: 'ui.agreement' },
                concepts: [{ text: 'The claim', tooltipId: 'ui.agreement' }],
              },
            ],
          },
          success_at_cost: {
            overview:
              'The word is given and the stranger is gone. The first payment came due that ' +
              'same night, in sleep. Every evening between here and the full moon has the ' +
              'appointment in it.',
            changes: [
              {
                id: 'slice.crossroads.a_nights_sleep',
                kind: 'trait',
                title: 'The Night After',
                causeClause: 'The word left them and the evening road stopped being an ordinary evening road',
                detail: 'They lie awake going over what they agreed to. The first night’s sleep is gone already.',
                polarity: 'loss',
                category: 'scar',
                direction: 'loss',
                stateNoun: { text: 'the promise they gave at the crossroads', tooltipId: 'ui.agreement' },
                concepts: [{ text: 'The first night’s sleep' }],
              },
            ],
          },
          critical_failure: {
            overview:
              'He nodded as if a line had been entered somewhere, stepped back under the ' +
              'dead tree, and the crossroads got on with being a crossroads. The traveler ' +
              'walked east with less in their mouth than they had brought to it.',
            changes: [
              {
                id: 'slice.crossroads.not_theirs_anymore',
                kind: 'trait',
                title: 'Spoken Away',
                causeClause: 'The promise left their mouth and did not feel like theirs on the way out',
                detail: 'The promise is out of their keeping now, and it will not wait past the full moon.',
                polarity: 'loss',
                category: 'scar',
                direction: 'loss',
                stateNoun: { text: 'their own given word', tooltipId: 'ui.agreement' },
                concepts: [{ text: 'the full moon' }],
              },
            ],
          },
        },
      },
      positive: {
        // THR-1130 — `slice.crossroads.word_unspent` folded (Law 13 parity).
        overview:
          'The offer was real, and so was the refusal. The road east is the same road it was ' +
          'this morning, and they walk it owing nobody.',
        changes: [],
        reactions: [
          {
            id: 'slice.crossroads.walk_on',
            label: 'Walk on',
            intent: 'The road goes on east, and they still have their word.',
            effects: [
              {
                kind: 'reputation_tally',
                key: SLICE_ROAD_REPUTE_KEY,
                delta: SLICE_REPUTE_GAIN,
              },
            ],
          },
        ],
        byOutcome: {
          critical_success: {
            // THR-1130 — `slice.crossroads.refused_free` folded (Law 13 parity).
            overview:
              'The refusal cost them not one copper. He did not follow and did not frown. The ' +
              'crossroads dropped behind at the treeline like any other stretch of road, ' +
              'and that was the whole of it. They walk east knowing exactly what they can ' +
              'turn down.',
            changes: [],
          },
          critical_failure: {
            overview:
              'They refused, and the wanting he had named kept them company far past the ' +
              'treeline. Nothing was promised. Nothing was taken. He had still got a good ' +
              'long look at what the traveler would have said yes to.',
            changes: [
              {
                id: 'slice.crossroads.the_wanting_named',
                kind: 'trait',
                title: 'The Wanting, Named',
                causeClause:
                  'They said no — after the offer had been shaped to fit them exactly',
                detail:
                  'The stranger under the dead tree knows what they want most now, and they told him for free.',
                polarity: 'loss',
                category: 'scar',
                direction: 'loss',
                stateNoun: {
                  text: 'the stranger under the dead tree',
                  entityId: '$cast:stranger',
                  visualKind: 'agent',
                },
                concepts: [{ text: 'what they want most' }],
              },
            ],
            reactions: [
              {
                id: 'slice.crossroads.walk_on_read',
                label: 'Walk on',
                intent: 'They keep their word, and the stranger keeps what they told him.',
                effects: [
                  {
                    kind: 'reputation_tally',
                    key: SLICE_ROAD_REPUTE_KEY,
                    delta: SLICE_REPUTE_GAIN,
                  },
                  {
                    kind: 'hidden_mark',
                    category: 'secret_knowledge',
                    severity: SLICE_CONCEALED_ACTION_SEVERITY,
                    label: 'A stranger at the crossroads read what they want most',
                  },
                ],
              },
            ],
          },
        },
      },
    },
    fallback: {
      overview:
        'The crossroads empties one road at a time, and the stone under the dead tree stays '
        + 'where it stands.',
      changes: [
        {
          id: 'slice.crossroads.the_marker',
          kind: 'shell_state',
          title: 'The Marker and the Tree',
          causeClause: 'They took one of the four roads out and left the stone where it stands',
          detail:
            'They know what waits under that dead tree now, and they know the road back to it if they ever want the offer again.',
          polarity: 'info',
          category: 'path',
          direction: 'opens',
          stateNoun: {
            text: 'the road back they carry with them',
            entityId: '$actor',
            visualKind: 'agent',
          },
          concepts: [{ text: 'that dead tree' }],
        },
      ],
      reactions: [
        {
          id: 'slice.crossroads.move_along',
          label: 'Move along',
          intent: 'The treeline takes the road back.',
          effects: [
            // Law 56 (THR-1141): 'The Marker and the Tree' claims they know the
            // road back if they ever want the offer again. The seed is what makes
            // "again" a thing the world holds — `inheritContext` keeps the same
            // stranger under the same tree (THR-1110), so the sentence describes
            // a scheduled return rather than a mood.
            {
              kind: 'encounter_seed',
              templateId: SLICE_TEMPLATE_IDS.crossroads,
              targetAgentId: '$actor',
              delayTicks: SLICE_CROSSROADS_RETURN_DELAY_TICKS,
              seedLabel: 'The road bends back toward a dead tree and an offer left unanswered.',
              inheritContext: true,
            },
            {
              kind: 'intelligence',
              category: 'cultural_knowledge',
              label: 'The marker under the dead tree',
              detail:
                'What waits at that crossroads, what it asks for, and which of the four roads '
                + 'comes back to it.',
              targetAgentId: '$actor',
              reliability: 0.8,
            },
          ],
        },
      ],
    },
  },
  narrativeTemplates: {
    initiation: 'A stranger at the crossroads knows the traveler’s name, and has an offer priced in promises.',
    success: 'The crossroads was left behind on the traveler’s own terms.',
    failure: 'The crossroads kept more of the evening than it gave back.',
  },
  description:
    'A stranger at a crossroads knows the traveler’s name and offers a bargain priced in ' +
    'promises instead of coin. Whether it is taken turns on who the traveler is — and on ' +
    'how heavily the god leans.',
};

// ═════════════════════════════════════════════════════════════════════
// 4b. THE FULL MOON COLLECTION — Seeded Sequel of the crossroads bargain
// ═════════════════════════════════════════════════════════════════════
//
// Crux: the promise made at the crossroads falls due tonight.
// Shape: Seeded Sequel (Single Test) · Setting: wayside · Pressure: oath ·
// Form: fulfil · Objective: fulfil · Stakes: item (the gift is real —
// spawn_artifact, category talisman, runtime-picked so no id can rot) ·
// System: seeds (closing), items, movement.
// Prose rule 7: this scene MAY reference the crossroads and the promise —
// the parent minted both, and this template only ever fires from its seed.
// Promise→payoff: the parent's "what is he?" pays what it can here — and
// pays it the way the tales would: politely, and not entirely.

const FULL_MOON_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared focus family, the common option.
    id: 'slice.fullmoon.steady_nerve',
    name: 'Steady Nerve',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine: 'Their breathing stays even while the moonlight fills, and the meeting starts with a level head.',
    bandProse: {
      success: 'The appointment was kept with a level head, and it showed.',
      failure: 'The nerve held through the greeting. The parcel’s weight undid it.',
    },
  },
  {
    // Type: Boost — mind, holding the bargain's exact words.
    id: 'slice.fullmoon.read_the_coat',
    name: 'Read the Coat',
    sphere: 'mind',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.memory',
    effectLine: 'Last month’s meeting stays sharp in their mind — any word tonight that differs from the bargain stands out.',
    bandProse: {
      near_miss: 'Every word matched the bargain. The look that came with the last one did not.',
      critical_failure: 'The words matched the bargain exactly, and that exactness was its own warning.',
    },
  },
  {
    // Type: Boost — light, an honest meeting ground.
    id: 'slice.fullmoon.moonlit_ground',
    name: 'Light the Ground',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.06,
    imageTag: 'generic.light',
    effectLine: 'The moon falls flat and even across the road, and nothing about the meeting hides in a shadow.',
    bandProse: {
      critical_success: 'Under that even light the exchange was exactly what it claimed to be, and both sides saw it.',
      success: 'The whole exchange happened in plain light, and plain light kept it honest.',
      failure: 'The light was even. What was wrong with the meeting was not standing in a shadow.',
    },
  },
  {
    // Type: Boost — order, the ritual of the exchange.
    id: 'slice.fullmoon.the_old_forms',
    name: 'Keep the Forms',
    sphere: 'order',
    essenceCost: 2,
    forecastDelta: 0.05,
    imageTag: 'generic.oath',
    effectLine: 'Greeting, parcel, parting — the ritual carries the exchange even if nerve does not.',
    bandProse: {
      success_at_cost: 'The forms carried the exchange to its end. The extra sentence came after the forms were done.',
      failure: 'The greeting and the parcel went by the forms. The parting did not.',
    },
  },
  {
    // Type: Ward — spirit, closing the read he took at the crossroads.
    id: 'slice.fullmoon.ward_against_wanting',
    name: 'Ward Against Wanting',
    sphere: 'spirit',
    essenceCost: 1,
    forecastDelta: 0.04,
    imageTag: 'generic.ward',
    effectLine: 'The hunger the stranger once read in them goes quiet, and nothing tonight is priced off it.',
    bandProse: {
      near_miss: 'The wanting stayed quiet. The stranger set his price off a different hunger.',
      critical_failure: 'The wanting stayed quiet all night, and he noticed that too.',
    },
  },
];

const FULL_MOON_STEP: ActionStep = {
  reach: 'star',
  duration: { min: 1, max: 1 },
  difficulty: 0.3,
  purposeLine: 'Keep the appointment',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  // The P2+P3 spine (Doctrine v2). The per-class P1 arrival lands above this
  // at instantiation. No cast token — this template declares no bundle; the
  // stranger arrives through the parent seed's inherited context.
  narrativeTemplate:
    'The stranger from the crossroads is there before the light finishes arriving — same coat, same clean ' +
    'boots — holding a wrapped parcel the size of the gift he described. He is pleased the promise held.\n\n' +
    'All that remains is to take the gift from his hands, and to stand the exchange well.',
  successAfterimage: 'The gift changed hands under the full moon, and the stranger bowed like a merchant after a fair sale.',
  failureAfterimage: 'The parcel passed to the traveler’s hands cold and heavier than it looked.',
  successAtCostAfterimage: 'The gift was given, and with it one more sentence than the traveler wanted to hear.',
  criticalSuccessAfterimage: 'The gift was everything he had described, and he left the moonlight first, which the tales say means the debt is closed for good.',
  criticalFailureAfterimage: 'The gift was real, and so was the look he gave the traveler after — the look of a man updating a ledger.',
  nudges: FULL_MOON_HAND,
};

export const SLICE_FULL_MOON_COLLECTION: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.fullMoon,
  rarityTier: 3,
  intrinsicTier: 'background',
  name: 'The Full Moon Collection',
  reach: 'star',
  crudType: 'read',
  scale: 'local',
  steps: [FULL_MOON_STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['tradition_novelty'],
  settings: ['wayside'],
  // P1 arrival (Doctrine v2) — the P2/P3 spine lands below it (FULL_MOON_STEP).
  openings: {
    wayside: '{name} is on the open road near {location} when the moon rises full.',
  },
  locationSubtypes: expandSettings(['wayside']),
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      // As on the crossroads accept path: bands override `overview` + `changes`
      // only. The gift is a `spawn_artifact` on this reaction, and a band that
      // authored its own reactions would replace the reaction the gift rides on.
      overview:
        'The promise is spent and the gift is real. The stranger takes what he came for and ' +
        'walks off west, and the road stops feeling watched.',
      changes: [
        {
          id: 'slice.fullmoon.the_gift',
          kind: 'item',
          title: 'The Crossroads Gift',
          causeClause: 'They came to the moonlight on the night they said they would and kept the promise',
          detail: 'The parcel is theirs — everything he described, and he described it accurately.',
          polarity: 'gain',
          category: 'boon',
          direction: 'gain',
          // G1 (THR-1164): the parcel is a `spawn_artifact` from a *category*, and
          // its contents being unknown is the fiction, so there is no template node
          // to point at and no instance id until the reaction fires. Anchored
          // through its carrier per the catalog's clarification 2 — the traveller
          // is real now, and the gift lands in their possessions where the noun
          // says it does. A `$spawned:` form is what would let this click straight
          // to the item; see the G1 note on the ticket.
          stateNoun: { text: 'the parcel in their hands', entityId: '$actor', visualKind: 'agent' },
          concepts: [{ text: 'The parcel' }],
        },
      ],
      reactions: [
        {
          id: 'slice.fullmoon.take_the_gift',
          label: 'Take the gift',
          intent: 'The parcel takes both hands, and the wrapping gives nothing away.',
          effects: [
            {
              kind: 'spawn_artifact',
              category: 'talisman',
              targetAgentId: '$actor',
              messageOverride: 'The crossroads gift, collected under the full moon.',
            },
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          overview:
            'He left the moonlight first, which the tales say means the debt is closed for ' +
            'good. He did not look back at the road, and the road did not feel watched ' +
            'after he had gone.',
          changes: [
            {
              id: 'slice.fullmoon.the_gift_clean',
              kind: 'item',
              title: 'The Crossroads Gift',
              causeClause: 'He handed the parcel over and let go of it without a second clause',
              detail: 'The gift is theirs outright, exactly as it was described at the dead tree.',
              polarity: 'gain',
              category: 'boon',
              direction: 'gain',
              // G1: carrier-anchored — see the note on 'slice.fullmoon.the_gift'.
              stateNoun: { text: 'the parcel in their hands', entityId: '$actor', visualKind: 'agent' },
              concepts: [{ text: 'theirs outright' }],
            },
            {
              id: 'slice.fullmoon.he_left_first',
              kind: 'shell_state',
              title: 'He Left First',
              causeClause: 'He walked out of the moonlight ahead of them and did not look back at the road',
              detail:
                'No one at the crossroads holds a claim on them any more. The tales are firm about who leaves first.',
              polarity: 'gain',
              category: 'bond',
              direction: 'gain',
              stateNoun: { text: 'the promise at the crossroads', tooltipId: 'ui.agreement' },
              concepts: [{ text: 'a claim' }],
            },
          ],
        },
        success_at_cost: {
          overview:
            'He said the extra sentence lightly, the way a man mentions a second ' +
            'appointment while handing over the first parcel, and then the moonlight had ' +
            'nobody in it but them.',
          // Two chips, not one mixed chip. A single `item`/`mixed` change
          // classifies as TOLL and quietly under-reports that the gift was in
          // fact handed over — the prize and the price are separate facts and
          // Law 31 wants each one's polarity legible on its own.
          changes: [
            {
              id: 'slice.fullmoon.the_gift_at_cost',
              kind: 'item',
              title: 'The Crossroads Gift',
              causeClause: 'The promise was kept in full and the parcel came across as agreed',
              detail: 'The gift is theirs, handed over exactly as it was described.',
              polarity: 'gain',
              category: 'boon',
              direction: 'gain',
              // G1: carrier-anchored — see the note on 'slice.fullmoon.the_gift'.
              stateNoun: { text: 'the parcel in their hands', entityId: '$actor', visualKind: 'agent' },
              concepts: [{ text: 'The gift' }],
            },
            {
              id: 'slice.fullmoon.one_more_sentence',
              kind: 'shell_state',
              title: 'One More Sentence',
              causeClause:
                'He added one more sentence with the parcel already in their hands, and did not wait for an answer',
              detail: 'They walk away owing a meeting they never agreed to, to a creditor who does not forget.',
              polarity: 'loss',
              category: 'bond',
              direction: 'loss',
              stateNoun: {
                text: 'the second appointment they now carry',
                entityId: '$actor',
                visualKind: 'agent',
              },
              concepts: [{ text: 'a meeting they never agreed to' }],
            },
          ],
          reactions: [
            {
              id: 'slice.fullmoon.take_the_gift_and_the_sentence',
              label: 'Take the gift',
              intent: 'The parcel changes hands. The extra sentence rides along with it.',
              effects: [
                {
                  kind: 'spawn_artifact',
                  category: 'talisman',
                  targetAgentId: '$actor',
                  messageOverride: 'The crossroads gift, collected under the full moon.',
                },
                {
                  kind: 'encounter_seed',
                  templateId: SLICE_TEMPLATE_IDS.crossroads,
                  targetAgentId: '$actor',
                  delayTicks: SLICE_FULL_MOON_DELAY_TICKS,
                  seedLabel: 'The stranger mentioned a second appointment, and he keeps his appointments.',
                  inheritContext: true,
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview:
            'He bowed over the exchange like a man updating a ledger. The promise was kept ' +
            'in every particular, and the moonlight went on feeling occupied long after he ' +
            'was out of it.',
          changes: [
            {
              id: 'slice.fullmoon.the_gift_ledgered',
              kind: 'item',
              title: 'The Crossroads Gift',
              causeClause: 'He shorted them nothing and gave the parcel whole',
              detail: 'The gift is theirs, real and entire, with no clause anyone can point to.',
              polarity: 'gain',
              category: 'boon',
              direction: 'gain',
              // G1: carrier-anchored — see the note on 'slice.fullmoon.the_gift'.
              stateNoun: { text: 'the parcel in their hands', entityId: '$actor', visualKind: 'agent' },
              concepts: [{ text: 'no clause' }],
            },
            {
              id: 'slice.fullmoon.the_ledger_open',
              kind: 'shell_state',
              title: 'The Ledger, Open',
              causeClause: 'He bowed, took the kept promise, and looked at them like unfinished business',
              detail:
                'The promise is paid in full, and he still keeps their name on a list.',
              polarity: 'loss',
              category: 'bond',
              direction: 'loss',
              stateNoun: { text: 'the page he keeps them on', entityId: '$actor', visualKind: 'agent' },
              concepts: [{ text: 'his books' }],
            },
          ],
        },
      },
    },
  },
  narrativeTemplates: {
    initiation: 'A promise made at a crossroads falls due tonight.',
    success: 'The promise was kept, and the gift is real.',
    failure: 'The appointment was kept, and it cost more sleep than it should have.',
  },
  description:
    'A promise made at a crossroads falls due tonight, and the one who holds it has come to ' +
    'collect. A god can press the debt toward its agreed terms, or let it be contested in the dark.',
};

// ═════════════════════════════════════════════════════════════════════
// 5. THE SWINDLED FAMILY — Opt-in Complication (Hook #204)
//    ├─ seeds THE SWINDLER FOUND on the help path
//    └─ seeds THE GRATEFUL KIN on the help path
// ═════════════════════════════════════════════════════════════════════
//
// Crux: a swindled family is walking into the salt fen the traveler just
//       crossed, and only the traveler knows it.
// Shape: Opt-in Complication — the engage/decline gate runs on
// mercy↔ruthlessness (positive = mercy = help) · Setting: wayside · Pressure:
// hunger · Form: migration · Objectives: the family means to settle; the
// agent decides · Stakes: engaging costs real time (the walk to the unmarked
// turn); the reward is the seeded pair; declining costs one afterimage line ·
// System: movement + forks + seeds; the family's exhaustion is scene flavor
// with a live condition target.
// Why the agent: the family is walking into the agent's own back-trail this
// leg — scene-local knowledge, no prior-visit claim.
// Connected systems (Q8): forks, seeds ×2, conditions (a Balm target on the
// help step), cards — 4 beyond the core test.

const FAMILY_MEETING_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — life; the pity felt at full weight. Leans toward helping.
    id: 'slice.family.soft_heart',
    name: 'Soften the Heart',
    sphere: 'life',
    essenceCost: 1,
    forecastDelta: 0.07,
    poleLean: { axis: 'mercy_ruthlessness', toward: 'positive' },
    imageTag: 'generic.warmth',
    effectLine: 'The children’s worn shoes land at full weight, and the choice is made feeling all of it. It argues for stopping.',
    bandProse: {
      success: 'The smallest shoe did most of the talking.',
      failure: 'The pity landed whole. So did the count of miles left in the day.',
    },
  },
  {
    // Type: Boost — common; the road's arithmetic. Leans toward walking on.
    id: 'slice.family.hard_miles',
    name: 'Count the Miles',
    essenceCost: 1,
    forecastDelta: 0.05,
    poleLean: { axis: 'mercy_ruthlessness', toward: 'negative' },
    imageTag: 'generic.vigor',
    effectLine: 'The traveler’s own road stays in view — the hour, the distance, the bed at the end. It argues for walking on.',
    bandProse: {
      near_miss: 'Their own road stayed honest in view, and it almost won.',
      failure: 'The miles argued so well that the argument was all they heard.',
    },
  },
  {
    // Type: Boost — order; the words that say a hard thing cleanly.
    id: 'slice.family.plain_words',
    name: 'Ready the Words',
    sphere: 'order',
    essenceCost: 2,
    forecastDelta: 0.06,
    imageTag: 'generic.light',
    effectLine: 'The truth about the paper can be said without cruelty and without softening.',
    bandProse: {
      success_at_cost: 'The truth came out clean, and the man aged a year taking it.',
      success: 'The words came plain and kind at once, which is the hardest register there is.',
      failure: 'The words were lined up right, and the man refused delivery.',
    },
  },
  {
    // Type: Boost — mind; the story checked against itself.
    id: 'slice.family.their_story_holds',
    name: 'Test the Tale',
    sphere: 'mind',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine: 'The family’s story is checked as it is told, so the swindle is known real before anything is spent on it.',
    bandProse: {
      near_miss: 'The story held everywhere except the one place it mattered.',
      failure: 'The tale checked out in every detail, which made it worse to hear.',
    },
  },
  {
    // Type: Boost — time; the fork seen from above.
    id: 'slice.family.long_memory',
    name: 'Show the Endings',
    sphere: 'time',
    essenceCost: 2,
    forecastDelta: 0.07,
    imageTag: 'generic.memory',
    effectLine: 'Both roads stretch out to where they finish — theirs into the fen, the other toward the river country.',
    bandProse: {
      critical_success: 'Both roads unrolled to their ends in one look, and one of them ended in reeds and salt.',
      critical_failure: 'The long view blurred at the worst reach of it, and the fen kept its distance quiet.',
    },
  },
];

const FAMILY_GUIDE_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — common; the ground read as it comes.
    id: 'slice.family.read_the_land',
    name: 'Read the Land',
    essenceCost: 1,
    forecastDelta: 0.08,
    imageTag: 'generic.focus',
    effectLine: 'The drainage, the grass, the tree line all stay in view, and the good turn shows itself.',
    bandProse: {
      success: 'The land read true a mile at a time, all the long afternoon.',
      failure: 'The land read true, and the light ran out with the reading half done.',
    },
  },
  {
    // Type: Boost — light; the landmark shown plain.
    id: 'slice.family.kind_light',
    name: 'Hold the Light',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.07,
    imageTag: 'generic.light',
    effectLine: 'The afternoon stays long and low, so the unmarked turn reads from a distance and nobody finds it by luck.',
    bandProse: {
      critical_success: 'The low light picked the turn out of the country like a thumb on a map.',
      near_miss: 'The light held to the turn and not a stride past it.',
    },
  },
  {
    // Type: Boost — matter; the marker that stays behind.
    id: 'slice.family.sure_marker',
    name: 'Raise the Cairn',
    sphere: 'matter',
    essenceCost: 2,
    forecastDelta: 0.07,
    imageTag: 'generic.matter',
    effectLine: 'Their hands stay sure building the marker at the turn, and the road stays found after everyone walks away.',
    bandProse: {
      success_at_cost: 'The cairn went up sound. The light went while it did.',
      failure: 'The cairn was built with love and set a stride too early.',
    },
  },
  {
    // Type: Boost — energy; the family's last strength found.
    id: 'slice.family.second_wind_shared',
    name: 'Find the Reserve',
    sphere: 'energy',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.strength',
    effectLine: 'When the smallest walkers are done, their legs have one more hour in them.',
    bandProse: {
      near_miss: 'The children made the last mile. The cart barely did.',
      critical_failure: 'The second wind came, and the ninth day took it back with interest.',
    },
  },
  {
    // Type: Boost — time; the day paced to fit the detour.
    id: 'slice.family.gentle_hour',
    name: 'Widen the Hour',
    sphere: 'time',
    essenceCost: 1,
    forecastDelta: 0.05,
    imageTag: 'generic.blessing',
    effectLine: 'The useful part of the afternoon stretches, and the detour fits inside the day.',
    bandProse: {
      failure: 'The hour stretched as far as an hour goes. The turn was further.',
    },
  },
];

const FAMILY_MEETING_STEP: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 1 },
  difficulty: 0.3,
  purposeLine: 'Hear them out',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  // The P2+P3 spine (Doctrine v2). The per-class P1 arrival lands above this
  // at instantiation.
  narrativeTemplate:
    'A family with a handcart is walking east: a man, a woman, three children. A swindler sold them a deed ' +
    'to good land that way, and they hold the paper out proudly. East of here is only a salt fen.\n\n' +
    'Tell them the truth and find them a living road, or wish them luck and walk on.',
  successAfterimage: 'The family’s story was heard start to finish, paper and all.',
  failureAfterimage: 'The story came out sideways and slow, and the sun was down before the end of it.',
  successAtCostAfterimage: 'They heard it all, and some of it will be hard to put down again.',
  criticalSuccessAfterimage: 'The whole tale came out in order, and with it the name of the man who sold the paper.',
  criticalFailureAfterimage: 'The telling went wrong, and the man walked off mid-sentence to stand by his cart.',
  nudges: FAMILY_MEETING_HAND,
};

/** Help path — the walk to the unmarked turn. The delay is the price. */
const FAMILY_GUIDE_STEP: ActionStep = {
  reach: 'eye',
  duration: { min: 2, max: 3 },
  difficulty: 0.4,
  purposeLine: 'Find them a living road',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The river country is two days south for a cart this tired, and the turn to it hides in ' +
    'ordinary grass. The traveler walks at the head of the little column, reading the land, ' +
    'while the paper that started all this rides folded and demoted in the woman’s apron.',
  successAfterimage: 'The turn was found and marked, and the family went south toward water that exists.',
  failureAfterimage: 'The turn hid past dusk, and the family camped one more night on hope and thin bread.',
  successAtCostAfterimage: 'The turn was found late, and the traveler’s own road is now a day longer.',
  criticalSuccessAfterimage: 'The turn, a cairn, and a first green look at the river country, all before dark.',
  criticalFailureAfterimage: 'The country fought the reading all day, and by dusk the family had stopped asking the traveler for directions.',
  nudges: FAMILY_GUIDE_HAND,
};

/** Decline path — the road taken, the afterimage kept. */
const FAMILY_PASS_STEP: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 1 },
  difficulty: 0.15,
  purposeLine: 'Walk on',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The traveler wishes them luck, and means it, and keeps walking. The cart creaks east. ' +
    'For a while the road behind stays loud with children’s voices, and then the country ' +
    'folds them away.',
  successAfterimage: 'The traveler made the town by dark, as planned.',
  failureAfterimage: 'The town came by dark, and the supper went down badly with the family still out on the fen road.',
  successAtCostAfterimage: 'The road stayed easy. The evening did not.',
  criticalSuccessAfterimage: 'They made the town, the bed, and an early start, and owed no one a copper for any of it.',
  criticalFailureAfterimage: 'All evening the fen kept coming to mind, salt-grey and patient.',
};

const FAMILY_FORK: ActionStepBranch = {
  branchOnStep: 0,
  decidedBy: { axis: 'mercy_ruthlessness' },
  variants: {
    positive: FAMILY_GUIDE_STEP,
    negative: FAMILY_PASS_STEP,
  },
  fallback: FAMILY_PASS_STEP,
};

export const SLICE_SWINDLED_FAMILY: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.family,
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'The Swindled Family',
  reach: 'heart',
  crudType: 'read',
  scale: 'local',
  steps: [FAMILY_MEETING_STEP, FAMILY_FORK],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['mercy_ruthlessness'],
  settings: ['wayside'],
  // P1 arrival (Doctrine v2) — the P2/P3 spine lands below it
  // (FAMILY_MEETING_STEP).
  openings: {
    wayside: '{name} meets a handcart coming the other way, an hour past {location}.',
  },
  locationSubtypes: expandSettings(['wayside']),
  traitVariants: [
    {
      // Warmth does not need persuading to stop.
      traitId: 'trait.core.core_warmth.virtue',
      forecastDelta: 0.05,
      factorLine: 'Warm-hearted, they were slowing before the cart reached them.',
    },
  ],
  aftermathConfig: {
    // The deciding step, not the fork's own index — see THR-979 on the
    // crossroads config. FAMILY_FORK declares `branchOnStep: 0`.
    branchOnStep: 0,
    variants: {
      positive: {
        // THR-1130 — `slice.family.a_road_that_exists` folded (Law 13 parity).
        overview:
          'The family turns south with a marked road and the truth about their paper. They ' +
          'walk toward water instead of salt, and every one of them can name the stranger ' +
          'who turned them.',
        changes: [],
        reactions: [
          {
            id: 'slice.family.watch_them_go',
            label: 'Watch them go',
            intent: 'The cart shrinks southward, and the road resumes.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: SLICE_TEMPLATE_IDS.swindlerFound,
                targetAgentId: '$actor',
                delayTicks: SLICE_SWINDLER_DELAY_TICKS,
                seedLabel: 'The man who sold the paper is still working, and his face is known now.',
                inheritContext: true,
              },
              {
                kind: 'encounter_seed',
                templateId: SLICE_TEMPLATE_IDS.gratefulKin,
                targetAgentId: '$actor',
                delayTicks: SLICE_KIN_DELAY_TICKS,
                seedLabel: 'Word of a kindness on the fen road is traveling ahead of the traveler.',
                inheritContext: true,
              },
              {
                kind: 'reputation_tally',
                key: SLICE_ROAD_REPUTE_KEY,
                delta: SLICE_REPUTE_GAIN,
              },
            ],
          },
        ],
        byOutcome: {
          critical_success: {
            overview:
              'The turn came out of the country in the first hour — an old drover’s cut, ' +
              'dry the whole way, on no paper anyone ever sold. The family fed the traveler ' +
              'at their fire before the cart rolled, and the youngest drew the new road on ' +
              'the back of the worthless deed.',
            // THR-1130 — `slice.family.the_drovers_cut` folded (Law 13 parity).
            changes: [],
          },
          success_at_cost: {
            overview:
              'The turn was found late, and finding it cost the traveler a day of their own ' +
              'road. The cart went south anyway, and the fen goes hungry. The traveler’s ' +
              'day does not come back.',
            changes: [
              {
                id: 'slice.family.a_day_of_their_own',
                kind: 'shell_state',
                title: 'A Day of Their Own Road',
                causeClause: 'The turn took until dusk to find, and the finding was done on their own road',
                detail: 'They are a day behind where they meant to be, and it was not a spare day.',
                polarity: 'loss',
                category: 'scar',
                direction: 'loss',
                stateNoun: { text: 'a day of their own road', entityId: '$actor', visualKind: 'agent' },
                concepts: [{ text: 'a day behind' }],
              },
              // THR-1130 — `slice.family.south_regardless` deleted, not folded
              // (Law 13 parity). Its sentence claimed the family "owes them the
              // road south"; no effect on this band writes a favour edge, so
              // folding it would move a false state claim into prose rather than
              // retire it (Law 56 clause 1). The cart going south anyway is
              // already the overview's second sentence.
            ],
          },
          critical_failure: {
            // The only band in the slice that deliberately drops a seed. The
            // Grateful Kin fires on word of a kindness travelling; a day of
            // failed guiding that thinned the family's faith in strangers does
            // not mint that word. The swindler seed survives — his face is
            // known either way, which was never the family's to give or withhold.
            // THR-1130 — `slice.family.faith_thinned` folded (Law 13 parity).
            overview:
              'The country fought the reading all day and won. The turn stayed hidden, the ' +
              'light went, and by dusk the family had stopped asking the stranger questions. ' +
              'They will find the river themselves or they will not. They will tell it as a ' +
              'day a stranger cost them.',
            changes: [],
            reactions: [
              {
                id: 'slice.family.leave_them_to_it',
                label: 'Leave them to it',
                intent: 'The help is spent. The road east is still wrong, and they still have to walk it.',
                effects: [
                  {
                    kind: 'encounter_seed',
                    templateId: SLICE_TEMPLATE_IDS.swindlerFound,
                    targetAgentId: '$actor',
                    delayTicks: SLICE_SWINDLER_DELAY_TICKS,
                    seedLabel: 'The man who sold the paper is still working, and his face is known now.',
                    inheritContext: true,
                  },
                  {
                    kind: 'reputation_tally',
                    key: SLICE_ROAD_REPUTE_KEY_ILL,
                    delta: SLICE_REPUTE_LOSS,
                  },
                ],
              },
            ],
          },
        },
      },
      negative: {
        overview:
          'The family keeps the road east, and the traveler keeps their own. The fen is four ' +
          'days on, and nobody will be there to see what it makes of them.',
        changes: [
          {
            id: 'slice.family.east_is_theirs',
            kind: 'shell_state',
            title: 'East Is Theirs',
            causeClause: 'They let the handcart go east and kept walking their own road at their own pace',
            detail:
              'Their day is still their own and the town is still reachable by dark. The fen does its work out of their sight.',
            polarity: 'info',
            category: 'path',
            direction: 'opens',
            stateNoun: { text: 'their own road', entityId: '$actor', visualKind: 'agent' },
            concepts: [{ text: 'the fen' }],
          },
        ],
        reactions: [
          {
            id: 'slice.family.make_the_town',
            label: 'Make the town by dark',
            intent: 'The planned road, at the planned pace.',
            effects: [
              // Law 56 (THR-1141): 'East Is Theirs' claims the fen does its work
              // out of their sight. Out of sight is not out of the world — the
              // seed is what makes the phrase true, bringing back what happened
              // on the road they did not take.
              {
                kind: 'encounter_seed',
                templateId: SLICE_TEMPLATE_IDS.family,
                targetAgentId: '$actor',
                delayTicks: SLICE_FAMILY_NEWS_DELAY_TICKS,
                seedLabel: 'Word comes back from the fen road about a handcart and three children.',
                inheritContext: true,
              },
              {
                kind: 'intelligence',
                category: 'trade_route',
                label: 'The fen road, east of the fork',
                detail:
                  'What the salt-grey country east of the fork does to people who walk into it '
                  + 'with a handcart and no guide.',
                targetAgentId: '$actor',
                reliability: 0.75,
              },
            ],
          },
        ],
        byOutcome: {
          critical_failure: {
            overview:
              'The town came by dark and the bed was where it was meant to be. It did not ' +
              'help. The fen sat at the edge of the evening, salt-grey and patient, with ' +
              'three children’s shoes somewhere on the road toward it.',
            changes: [
              {
                id: 'slice.family.the_fen_in_mind',
                kind: 'trait',
                title: 'The Fen, in Mind',
                causeClause:
                  'The evening was quiet, and they spent it thinking about the fen',
                detail:
                  'They made the town on schedule and lie awake counting what it cost somebody else.',
                // SCAR on the spirit. Nothing was taken from them by anyone
                // else; they spent it themselves, which is the shape Christian's
                // "loss of confidence" example names.
                polarity: 'info',
                category: 'scar',
                direction: 'loss',
                stateNoun: { text: 'their own certainty', entityId: '$actor', visualKind: 'agent' },
                concepts: [{ text: 'lie awake counting' }],
              },
            ],
            reactions: [
              {
                id: 'slice.family.make_the_town_haunted',
                label: 'Make the town by dark',
                intent: 'The planned road, at the planned pace, and a long evening at the end of it.',
                effects: [
                  {
                    kind: 'quintessence_shift',
                    delta: SLICE_NERVE_EROSION,
                    source: 'slice.family.the_fen_in_mind',
                  },
                  // Carried down from the base reaction on purpose. THR-1141
                  // added the fen-road seed and intel to `negative`'s base
                  // reaction so 'East Is Theirs' has a write behind it; this
                  // band authors its own `reactions`, and
                  // `applyAftermathOutcomeBand` substitutes them **wholesale**,
                  // so anything not repeated here is silently dropped. The
                  // haunted ending is the one that most needs the news to come
                  // back — that is the whole shape of it.
                  {
                    kind: 'encounter_seed',
                    templateId: SLICE_TEMPLATE_IDS.family,
                    targetAgentId: '$actor',
                    delayTicks: SLICE_FAMILY_NEWS_DELAY_TICKS,
                    seedLabel: 'Word comes back from the fen road about a handcart and three children.',
                    inheritContext: true,
                  },
                  {
                    kind: 'intelligence',
                    category: 'trade_route',
                    label: 'The fen road, east of the fork',
                    detail:
                      'What the salt-grey country east of the fork does to people who walk into '
                      + 'it with a handcart and no guide.',
                    targetAgentId: '$actor',
                    reliability: 0.75,
                  },
                ],
              },
            ],
          },
        },
      },
    },
    fallback: {
      overview: 'The two roads part at the meeting point, each taking its own people.',
      changes: [
        {
          id: 'slice.family.two_roads',
          kind: 'shell_state',
          title: 'Two Roads',
          causeClause: 'They met a cart going the wrong way and the meeting point emptied in both directions',
          detail: 'They know what lies east of here now, and they will not walk into it themselves.',
          polarity: 'info',
          category: 'path',
          direction: 'opens',
          stateNoun: {
            text: 'what they know of the fen road east',
            entityId: '$actor',
            visualKind: 'agent',
          },
          concepts: [{ text: 'east of here' }],
        },
      ],
      reactions: [
        {
          id: 'slice.family.roads_part',
          label: 'Let the roads part',
          intent: 'East is theirs. The rest is the traveler’s.',
          effects: [
            // Law 56 (THR-1141): 'Two Roads' claims they know what lies east and
            // will not walk into it. Knowing is the write — a record the fen-road
            // steps can read — and the seed brings the other road's answer back.
            {
              kind: 'intelligence',
              category: 'trade_route',
              label: 'The fen road east of the meeting point',
              detail:
                'Salt ground, no guide, and a deed that buys nothing. Anyone walking it with a '
                + 'handcart is walking it once.',
              targetAgentId: '$actor',
              reliability: 0.8,
            },
            {
              kind: 'encounter_seed',
              templateId: SLICE_TEMPLATE_IDS.family,
              targetAgentId: '$actor',
              delayTicks: SLICE_FAMILY_NEWS_DELAY_TICKS,
              seedLabel: 'The fen road gives back word of the family who took it.',
              inheritContext: true,
            },
          ],
        },
      ],
    },
  },
  narrativeTemplates: {
    initiation: 'A cheerful family is walking into a salt fen with a worthless paper for a map.',
    success: 'The family’s road was mended, or honestly left — both on purpose.',
    failure: 'The meeting went poorly, and both roads kept their troubles.',
  },
  description:
    'A cheerful family is walking into a salt fen carrying a worthless deed for a map. ' +
    'Nothing obliges the traveler to stop them, and only a god’s weight makes a day spent ' +
    'on strangers likely.',
};

// ═════════════════════════════════════════════════════════════════════
// 5b. THE SWINDLER FOUND — Seeded Sequel of the family (help path)
// ═════════════════════════════════════════════════════════════════════
//
// Crux: the man who sold the family their worthless paper is working a new
//       crowd, and the traveler knows his face.
// Shape: Seeded Sequel → Personality Fork on mercy↔ruthlessness — positive
// (Protector) hands him to the town's justice; negative (Conqueror) settles
// it directly · Setting: urban · Pressure: greed (his) · Form: accusation ·
// Objective: prevent · Stakes: no-penalty + closing the chain · System:
// forks + seeds (closing); conditions on a bad end.
// Prose rule 7: "the same coat, the same paper" is legal here — the parent
// minted this knowledge, and this template only fires from its seed.

const SWINDLER_MARK_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared focus family, the common option.
    id: 'slice.swindler.steady_gaze',
    name: 'Steady Gaze',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.focus',
    effectLine: 'Their watching stays calm and unhurried, and the man is confirmed without feeling it.',
    bandProse: {
      success: 'It was him: same coat, same cadence, same paper held up like a lamp.',
      near_miss: 'It was him past all doubt. Doubt was not the one watching back.',
    },
  },
  {
    // Type: Boost — spirit; the crowd's mood read as one animal.
    id: 'slice.swindler.crowds_mood',
    name: 'Read the Crowd',
    sphere: 'spirit',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.rumor',
    effectLine: 'The market’s temper shows plain — who believes him, who wavers, who would turn.',
    bandProse: {
      success_at_cost: 'The crowd’s temper read true, and reading it meant standing close enough to be remembered.',
      failure: 'The market’s mood ran shallow and pleased, the worst weather for a hard truth.',
    },
  },
  {
    // Type: Boost — order, this card leans toward the law's road.
    id: 'slice.swindler.cold_certainty',
    name: 'Ready the Case',
    sphere: 'order',
    essenceCost: 2,
    forecastDelta: 0.07,
    poleLean: { axis: 'mercy_ruthlessness', toward: 'positive' },
    imageTag: 'generic.focus',
    effectLine: 'What is known lines up into charges a warden can act on. It argues for the law.',
    bandProse: {
      critical_success: 'The case assembled itself: the paper, the patter, the family’s names, the fen.',
      failure: 'The case was sound and the wardens were elsewhere, the town-sized version of bad weather.',
    },
  },
  {
    // Type: Undertow — life inverted? No: chaos, and it leans toward settling it directly.
    id: 'slice.swindler.old_anger',
    name: 'Stoke the Anger',
    sphere: 'chaos',
    essenceCost: 1,
    forecastDelta: 0.06,
    poleLean: { axis: 'mercy_ruthlessness', toward: 'negative' },
    imageTag: 'generic.energy',
    effectLine: 'The memory of the children’s shoes burns at full heat. It argues for settling it here.',
    bandProse: {
      near_miss: 'The anger burned clean and nearly chose the hour by itself.',
      critical_failure: 'The anger arrived ahead of the plan and introduced itself to the whole market.',
    },
  },
  {
    // Type: Boost — time; the pitch heard through to its pattern.
    id: 'slice.swindler.patient_hour',
    name: 'Follow the Patter',
    sphere: 'time',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.memory',
    effectLine: 'One whole pitch is heard through, and the man’s habits are learned before they are interrupted.',
    bandProse: {
      near_miss: 'The pattern came clear just as the pitch ended and the crowd began to pay.',
    },
  },
];

const SWINDLER_MARK_STEP: ActionStep = {
  reach: 'eye',
  duration: { min: 1, max: 1 },
  difficulty: 0.35,
  purposeLine: 'Mark the man',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  // The P2+P3 spine (Doctrine v2). The per-class P1 arrival lands above this
  // at instantiation. The swindler is introduced here by cast token.
  narrativeTemplate:
    'A familiar voice by the corn scales is selling land in the east — same coat, same paper held up like a ' +
    'lamp. It is {cast:swindler}, the man who sold the fen-road family their worthless deed, and a new ' +
    'family is already listening.\n\n' +
    'The town has wardens and a lockup; the man has an exit through the crowd. Mark him before he moves on.',
  successAfterimage: 'The man was marked, his patter noted, his exits counted.',
  failureAfterimage: 'The man worked the crowd like a professional, and had already spotted the traveler doing the same.',
  successAtCostAfterimage: 'He was marked, and once, briefly, he looked straight back.',
  criticalSuccessAfterimage: 'He was marked and mapped, his next pitch predicted to the sentence.',
  criticalFailureAfterimage: 'He was gone from the scales between one look and the next, the market suddenly short one voice.',
  nudges: SWINDLER_MARK_HAND,
};

/** Law path — the town's justice takes him. */
const SWINDLER_LAW_STEP: ActionStep = {
  reach: 'gold',
  duration: { min: 1, max: 2 },
  difficulty: 0.4,
  purposeLine: 'Bring the wardens',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'Wardens move at the speed of paperwork, and the man sells at the speed of hope. The ' +
    'work is to bring the two speeds together in one market square: the case said plainly, ' +
    'the paper in a warden’s hand, the man still behind his patter when the bell ends it.',
  successAfterimage: 'The wardens took him at the scales with the paper still in his hand.',
  failureAfterimage: 'The wardens came at their own pace, and the man left at his.',
  successAtCostAfterimage: 'He was taken, and the crowd’s disappointment needed managing more than he did.',
  criticalSuccessAfterimage: 'Taken mid-sentence, and the listening family got their coin back on the spot.',
  criticalFailureAfterimage: 'The wardens arrived to an empty pitch and one annoyed witness.',
};

/** Direct path — the settling, done personally. */
const SWINDLER_DIRECT_STEP: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 1 },
  difficulty: 0.4,
  purposeLine: 'Corner him',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'There is an alley behind the corn scales where the market noise goes quiet, and the ' +
    'man’s exit route runs through it. The work is simple and personal: be there when ' +
    'he takes it, and make the fen road cost him what it was going to cost that family.',
  successAfterimage: 'The alley conversation was short, and the satchel of takings changed ownership.',
  failureAfterimage: 'The man knew his own exits better than his marks did, and used one.',
  successAtCostAfterimage: 'He paid in the alley, and the traveler carried the bruises of the argument out of it.',
  criticalSuccessAfterimage: 'He paid everything, signed his own confession in front of two porters, and left town at a run.',
  criticalFailureAfterimage: 'The alley went wrong: he had a knife, a friend, and no interest in fair fights.',
};

const SWINDLER_FORK: ActionStepBranch = {
  branchOnStep: 0,
  decidedBy: { axis: 'mercy_ruthlessness' },
  variants: {
    positive: SWINDLER_LAW_STEP,
    negative: SWINDLER_DIRECT_STEP,
  },
  fallback: SWINDLER_LAW_STEP,
};

/**
 * The paper-seller himself — the man the mark is about.
 *
 * THR-1165, and the sharpest case of the three. The `hidden_mark` below used to aim
 * at `$cast:trader`, which is the inherited `urban` default's ambient "Market
 * Trader" — an honest merchant. A mark labelled *"Sells deeds to land that was never
 * his"* written onto that person is not a missing write, it is a false accusation
 * against a bystander, discoverable later by exactly the investigation and merchant
 * content the mark exists to feed. The swindler is cast so the mark has its man.
 */
const SWINDLER_SPEC: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'swindler',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  supportRole: 'deed_swindler',
  spawnNpcRole: 'merchant',
  spawnName: 'The Paper-Seller',
};

/** Composed, not replaced — same reasoning as {@link CROSSROADS_SUPPORT_BUNDLE}. */
const SWINDLER_SUPPORT_BUNDLE: EncounterSupportBundle = [
  ...DEFAULT_SETTING_SUPPORT_BUNDLES.urban,
  SWINDLER_SPEC,
];

export const SLICE_SWINDLER_FOUND: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.swindlerFound,
  rarityTier: 3,
  intrinsicTier: 'background',
  name: 'The Swindler Found',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',
  steps: [SWINDLER_MARK_STEP, SWINDLER_FORK],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['mercy_ruthlessness'],
  settings: ['urban'],
  // P1 arrival (Doctrine v2) — the P2/P3 spine lands below it
  // (SWINDLER_MARK_STEP).
  openings: {
    urban: '{name} comes into the market square of {location}.',
  },
  locationSubtypes: expandSettings(['urban']),
  // THR-1165 — casts the paper-seller, so the mark naming his crime names him
  // and not the ambient market trader the urban default would have supplied.
  supportBundle: SWINDLER_SUPPORT_BUNDLE,
  aftermathConfig: {
    // The deciding step, not the fork's own index — see THR-979 on the
    // crossroads config. SWINDLER_FORK declares `branchOnStep: 0`.
    branchOnStep: 0,
    variants: {
      positive: {
        // THR-1130 — `slice.swindler.the_ledger_way` folded (Law 13 parity).
        overview:
          'The town’s justice has the man, the paper, and a list of everyone else he sold it ' +
          'to. The wardens were slower than a mob would have been, and the lockup held ' +
          'anyway. The market knows them as the stranger who used its own law instead of an ' +
          'alley.',
        changes: [],
        reactions: [
          {
            id: 'slice.swindler.leave_it_to_law',
            label: 'Leave him to the town',
            intent: 'The bell, the wardens, the ledger. Done.',
            effects: [
              {
                kind: 'reputation_tally',
                key: SLICE_ROAD_REPUTE_KEY,
                delta: SLICE_REPUTE_GAIN,
              },
            ],
          },
        ],
        byOutcome: {
          critical_success: {
            overview:
              'The wardens took him mid-sentence, the paper still up like a lamp, and the ' +
              'listening family got their coin back on the spot in front of the whole ' +
              'square. The wardens were unhurried about it. That was the worst part for him.',
            // THR-1130 — `slice.swindler.coin_back_in_public` folded (Law 13 parity).
            changes: [],
          },
          failure: {
            overview:
              'Wardens move at the speed of paperwork. The man moved at the speed of a man ' +
              'who has left markets before. By the time the case was said plainly to anyone ' +
              'with a badge, the pitch was empty and the satchel was a town away.',
            changes: [
              {
                id: 'slice.swindler.gone_before_the_bell',
                kind: 'trait',
                title: 'Gone Before the Bell',
                causeClause:
                  'He packed up at the first sign of interest, and no warden had moved before the crowd closed over his pitch',
                detail:
                  'He is a town away and still selling the same land, and he has had a good look at the face that came for him.',
                polarity: 'loss',
                category: 'scar',
                direction: 'loss',
                stateNoun: { text: 'the face they showed him', entityId: '$actor', visualKind: 'agent' },
                concepts: [{ text: 'the face that came for him' }],
              },
            ],
            reactions: [
              {
                id: 'slice.swindler.leave_it_to_law_empty',
                label: 'Leave him to the town',
                intent: 'The bell, the wardens, the ledger — and an empty pitch by the time any of it moved.',
                effects: [
                  {
                    kind: 'hidden_mark',
                    category: 'reputation_note',
                    severity: SLICE_CONCEALED_ACTION_SEVERITY,
                    label: 'A paper-seller two markets from the fen road knows who informed on him',
                  },
                ],
              },
            ],
          },
        },
      },
      negative: {
        // THR-1130 — `slice.swindler.collected_in_person` folded (Law 13 parity).
        overview:
          'The debt was collected in person. By the third telling in the market there is a ' +
          'knife in the story that nobody remembers seeing, and it is not the kind version.',
        changes: [],
        reactions: [
          {
            id: 'slice.swindler.walk_away',
            label: 'Walk away',
            intent: 'The alley empties. The road waits.',
            effects: [
              {
                kind: 'reputation_tally',
                key: SLICE_ROAD_REPUTE_KEY_ILL,
                delta: SLICE_REPUTE_LOSS,
              },
            ],
          },
        ],
        byOutcome: {
          success_at_cost: {
            overview:
              'He paid in the alley, all of it, and the traveler carried the argument out of ' +
              'there on their own body. Behind the corn scales the market noise went on ' +
              'exactly as before.',
            changes: [
              {
                id: 'slice.swindler.the_argument',
                kind: 'trait',
                title: 'The Argument',
                causeClause: 'He paid all of it in the alley and he did not pay quietly',
                detail: 'The satchel is back where it belongs. The bruises will last longer than the money does.',
                polarity: 'loss',
                category: 'scar',
                direction: 'loss',
                stateNoun: { text: 'wounded', entityId: 'trait.condition.wounded', visualKind: 'attachment' },
                concepts: [{ text: 'the bruises' }],
              },
            ],
            reactions: [
              {
                id: 'slice.swindler.walk_away_sore',
                label: 'Walk away',
                intent: 'The alley empties. The road waits, and it will be walked stiffly.',
                effects: [
                  { kind: 'condition_attachment', templateId: 'trait.condition.wounded' },
                  {
                    kind: 'reputation_tally',
                    key: SLICE_ROAD_REPUTE_KEY_ILL,
                    delta: SLICE_REPUTE_LOSS,
                  },
                ],
              },
            ],
          },
          critical_failure: {
            // THR-1130 — `slice.swindler.the_market_talks` folded (Law 13 parity).
            overview:
              'The alley went wrong. He had a knife, a friend waiting past the turn, and no ' +
              'interest at all in a fair fight. The satchel left with them. The market ' +
              'found them afterward, on the ground behind the scales and slow to get up. It ' +
              'has them as the one who swung first and came off worse, and that is the ' +
              'version it will keep.',
            changes: [
              {
                id: 'slice.swindler.the_knife',
                kind: 'trait',
                title: 'The Knife',
                causeClause: 'He was readier for that alley than they were, and he was not alone in it',
                detail: 'They were cut behind the corn scales for a satchel that walked away without them.',
                polarity: 'loss',
                category: 'scar',
                direction: 'loss',
                stateNoun: { text: 'wounded', entityId: 'trait.condition.wounded', visualKind: 'attachment' },
                concepts: [{ text: 'cut behind the corn scales' }],
              },
            ],
            reactions: [
              {
                id: 'slice.swindler.get_up',
                label: 'Get up and go',
                intent: 'The road waits. It is going to have to wait a little.',
                effects: [
                  { kind: 'condition_attachment', templateId: 'trait.condition.wounded' },
                  {
                    kind: 'reputation_tally',
                    key: SLICE_ROAD_REPUTE_KEY_ILL,
                    delta: SLICE_REPUTE_LOSS,
                  },
                ],
              },
            ],
          },
        },
      },
    },
    fallback: {
      overview:
        'The stalls fold for the evening and the pitch by the corn scales stays empty. He was '
        + 'gone before anyone thought to look for him.',
      changes: [
        {
          id: 'slice.swindler.the_square_empties',
          kind: 'shell_state',
          title: 'The Square Empties',
          causeClause: 'They stood in a market until the stalls folded around the space where the voice had been',
          detail: 'They know his pitch, his patter and his hours now, and markets like this one repeat.',
          polarity: 'info',
          category: 'path',
          direction: 'opens',
          stateNoun: {
            text: 'what they know of his circuit',
            entityId: '$actor',
            visualKind: 'agent',
          },
          concepts: [{ text: 'his pitch' }],
        },
      ],
      reactions: [
        {
          id: 'slice.swindler.market_closes',
          label: 'Let the market close',
          intent: 'Stalls fold. The square empties.',
          effects: [
            // Law 56 (THR-1141): 'The Square Empties' makes three claims in one
            // sentence — they know his pitch, they know his hours, and markets
            // like this repeat — and each names a different real system. All
            // three are written: the knowledge, the mark that makes his trade
            // discoverable by market and investigation content, and the seed that
            // makes "repeat" a scheduled fact.
            {
              kind: 'intelligence',
              category: 'agent_network',
              label: 'The paper-seller’s circuit',
              detail:
                'His pitch, his patter, and the hours he works a market. He does not vary any '
                + 'of the three.',
              targetAgentId: '$actor',
              reliability: 0.85,
            },
            {
              kind: 'hidden_mark',
              category: 'concealed_action',
              severity: 0.5,
              label: 'Sells deeds to land that was never his',
              // THR-1165: was `$cast:trader` — the urban default's ambient honest
              // merchant. This mark names a crime; it must name its author.
              targetAgentId: '$cast:swindler',
              revealFamilies: ['investigation', 'merchant', 'social.investigate_reputation'],
            },
            {
              kind: 'encounter_seed',
              templateId: SLICE_TEMPLATE_IDS.swindlerFound,
              targetAgentId: '$actor',
              delayTicks: SLICE_SWINDLER_DELAY_TICKS,
              seedLabel: 'The same voice is working the same lie, a few markets on.',
              inheritContext: true,
            },
          ],
        },
      ],
    },
  },
  narrativeTemplates: {
    initiation: 'A familiar voice is selling a familiar lie two markets from the fen road.',
    success: 'The paper trade ended in this town, by warden or by alley.',
    failure: 'The man and his satchel moved on to a town with no one watching.',
  },
  description:
    'The paper-seller has surfaced again, working the same lie a few markets from the fen ' +
    'road. A god can steer justice toward the warden’s hands, or toward the alley’s.',
};

// ═════════════════════════════════════════════════════════════════════
// 5c. THE GRATEFUL KIN — Seeded Sequel of the family (help path)
// ═════════════════════════════════════════════════════════════════════
//
// Crux: word of a kindness on the road has run ahead of the traveler, and a
//       stranger wants to repay it.
// Shape: Seeded Sequel (gentle Single Test) · Setting: rural + urban ·
// Pressure: love · Form: return · Objective: repay (hers) · Stakes:
// relationship — THE legitimate favor mint: the favor edge is written HERE,
// in aftermath, and only from here on may prose ever lean on it — plus a
// pressed keepsake (item) · System: seeds (closing), favors (middling tier,
// used once in the slice, deliberately), items.

const KIN_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared warmth family, the common option.
    id: 'slice.kin.easy_grace',
    name: 'Loosen the Knot',
    essenceCost: 1,
    forecastDelta: 0.04,
    imageTag: 'generic.warmth',
    effectLine: 'The tightness in their chest eases, and the thanks lands on someone ready to receive it.',
    bandProse: {
      success: 'The thanks was met level, and the room liked both halves of it.',
      failure: 'The ease held until the third retelling, and then the smile ran out.',
    },
  },
  {
    // Type: Boost — mind, keeping the reply in reach.
    id: 'slice.kin.steady_voice',
    name: 'Steady the Voice',
    sphere: 'mind',
    essenceCost: 1,
    forecastDelta: 0.04,
    imageTag: 'generic.focus',
    effectLine: 'Their words stay in reach, and the reply comes out plain instead of mumbled.',
    bandProse: {
      near_miss: 'The words came out right. The pause before them ran a beat too long.',
      failure: 'The voice held through the thanks, and then a toast asked more of it than it had.',
    },
  },
  {
    // Type: Boost — light, softening the attention.
    id: 'slice.kin.warm_light',
    name: 'Soften the Lamplight',
    sphere: 'light',
    essenceCost: 1,
    forecastDelta: 0.04,
    imageTag: 'generic.light',
    effectLine: 'The glow on the table turns gentle, and the staring feels less like being weighed.',
    bandProse: {
      critical_success: 'The whole table sat inside the same warm ring of light, and the story fit it.',
      failure: 'The light was kind. The attention still had edges.',
    },
  },
  {
    // Type: Boost — spirit, tilting the room's temper.
    id: 'slice.kin.rooms_good_humor',
    name: 'Tilt the Room',
    sphere: 'spirit',
    essenceCost: 2,
    forecastDelta: 0.04,
    imageTag: 'generic.rumor',
    effectLine: 'The company laughs with them, not at them, and every retelling lands friendly.',
    bandProse: {
      success_at_cost: 'The room stayed friendly through all three retellings. It cost the evening.',
      critical_failure: 'The room’s warmth tipped into theater, and the traveler was the stage.',
    },
  },
  {
    // Type: Boost — time, one conversation instead of a performance.
    id: 'slice.kin.unhurried_hour',
    name: 'Slow the Evening',
    sphere: 'time',
    essenceCost: 1,
    forecastDelta: 0.03,
    imageTag: 'generic.memory',
    effectLine: 'The pace eases, and the thanks can be one conversation instead of a performance.',
    bandProse: {
      near_miss: 'The evening kept an easy pace. The last toast still found them tired.',
      failure: 'The slow hour helped until she stood up to speak, and then it did not.',
    },
  },
];

const KIN_STEP: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 1 },
  difficulty: 0.2,
  purposeLine: 'Take the thanks',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  // THR-1130 — density re-pass: one person thanking them in public, no props
  // with subplots. The P2+P3 spine (Doctrine v2); the per-class P1 arrival
  // lands above it at instantiation.
  narrativeTemplate:
    'The keeper of the house sets down a bowl nobody ordered and refuses the coin for it twice. She is kin ' +
    'to the family from the fen road, and she means to thank the traveler out loud, in front of everyone.\n\n' +
    'The room has stopped to listen. The thanks has to be stood in graciously.',
  successAfterimage: 'The thanks was taken well, and the room warmed accordingly.',
  failureAfterimage: 'The thanks was shrugged at, and the whole room saw the shrug.',
  successAtCostAfterimage: 'The thanks was taken, along with three retellings and a toast.',
  criticalSuccessAfterimage: 'By the second bowl the whole room owned a piece of the story, and was glad of the teller.',
  criticalFailureAfterimage: 'The thanks ran long in front of the whole room, and the traveler wore it all evening.',
  nudges: KIN_HAND,
};

export const SLICE_GRATEFUL_KIN: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.gratefulKin,
  rarityTier: 3,
  intrinsicTier: 'background',
  name: 'The Grateful Kin',
  reach: 'heart',
  crudType: 'read',
  scale: 'local',
  steps: [KIN_STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['loyalty_ambition'],
  settings: ['rural', 'urban'],
  // THR-1130 — density re-pass. Christian, playing this scene 2026-08-17:
  // *"the concepts here are again very weak, as if the agent who wrote them has
  // created a more complex story that it wants to relate in too little space.
  // the writing is in situ with specific people mentioning other specific
  // people."* The openings carried a brother, a cousin, three children, a
  // nine-day walk and a letter — four third parties and a prop, none of which the
  // player can act on, in sixty words. What the scene needs is one person
  // thanking them in public for something already done. The rest was backstory
  // competing with the beat.
  // P1 arrival (Doctrine v2) — the P2/P3 spine lands below it (KIN_STEP).
  openings: {
    rural: '{name} takes a room at the inn in {location}.',
    urban: '{name} finds a taproom in {location} at the end of the day.',
  },
  locationSubtypes: expandSettings(['rural', 'urban']),
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The family remembers who helped, and tonight they wrote the traveler down. There is ' +
        'a roof in this town that opens for them now.',
      changes: [
        // THR-1130 — the chip the director read out loud. Verbatim: *"the bond…
        // the roof they are owed: again this simply doesn't communicate what game
        // state has changed."* The write was real and well-formed the whole time;
        // every word of the chip was fiction. "A Roof, Remembered" / "the roof
        // they are owed" / a detail about beds and hearings — the word *favour*
        // and the debtor appeared nowhere, so a player reading it could not tell
        // that an `owes_favor` edge now exists or who is on the other end of it.
        //
        // Two fixes, both from the anchoring rule's second half ("the chip's
        // prose refers to that particular game state"):
        //  1. **State first.** The noun names the mechanic and the detail names
        //     the endpoints — who owes whom what. Fiction moves to the tail of
        //     the sentence, where it decorates a claim the player can already read.
        //  2. **Anchor the debtor, not the creditor.** `favor_creation` writes
        //     debtor = target, creditor = actor, so this chip is a sentence about
        //     the target; `$actor` pointed the click at the wrong end of the edge.
        //     `$target` is new in this ticket for exactly this reason — the effect
        //     side has had the sentinel since THR-695 and the chip side did not.
        //
        // `{target}` enriches in `detail` and `causeClause` but **not** in
        // `stateNoun.text`, which the surface renders raw into the `CATEGORY ·
        // NOUN` tag — so the noun carries the mechanic and the detail carries
        // the name.
        {
          // THR-1175 — the chip that made the director ask the question that
          // unpicked this whole beat. Verbatim: *"if it is a graph edge, then you
          // must have created the edge to the town directly? so now the town,
          // sacred grove, owes the favour? … how would a town and a person
          // interact in a deep social scene?"* It would not, and could not.
          // `favor_creation` set debtor = `action.targetId`, this encounter
          // targets a *location*, and every consumer of `owes_favor` is
          // person-shaped — social leverage, tension drift, call-in and break all
          // read an individual's regard for another. So the edge was real,
          // well-formed, correctly anchored by the chip, and completely inert:
          // the only code that would ever touch it again was the expiry sweep
          // that deletes it ~80 ticks later.
          //
          // The fiction was never a person-debt. "There is a roof in this town
          // that opens for them now" is a property of the *place*, and places can
          // carry conditions (THR-1143). So the band now writes
          // `trait.condition.location.standing_welcome` onto the location, which
          // the Location Profile renders and the chip's `location`-kind anchor
          // clicks through to (THR-1172 shipped that tier two hours earlier).
          // Same gratitude, a mechanism that can actually pay it.
          id: 'slice.kin.a_standing_welcome',
          kind: 'reputation',
          title: 'A Standing Welcome',
          causeClause: 'The bowl came unasked and the coin went back twice, in front of the whole room',
          detail: '{target} keeps a door open for them now — a bed and a hearing the next time they come through.',
          polarity: 'gain',
          category: 'bond',
          direction: 'gain',
          // THR-1205 — the cluster now says how wide the door opened, matching
          // the intensity the reaction below writes. See the band constants.
          magnitude: { ladder: 'reputation', band: SLICE_KIN_WELCOME_BAND },
          // `visualKind: 'location'`, not `'agent'`. The old value was the second
          // half of the same bug: a location entityId declared as an agent, which
          // is what rendered the fallback "A" tile in the director's screenshot.
          //
          // THR-1205 — the noun names the *place*, not only the mechanic. A tag
          // reading `BOND · A STANDING WELCOME` states a thing with no referent;
          // the grant is only worth something because it is at this town. The
          // adapter enriches the noun, so `{target}` resolves here exactly as it
          // does in `detail`.
          stateNoun: { text: 'reputation with {target}', entityId: '$target', visualKind: 'location', tooltipId: 'ui.reputation_with' },
          concepts: [{ text: 'a bed and a hearing' }],
        },
      ],
      reactions: [
        {
          id: 'slice.kin.accept_the_debt',
          label: 'Accept the thanks',
          intent: 'A meal, a story told rightly, and a standing welcome.',
          effects: [
            {
              // THR-1206 — was `apply_condition → standing_welcome`, itself the
              // THR-1175 repair of a `favor_creation` that minted a favour owed by a
              // town. Both were the right *shape* and the wrong *noun*: the fiction
              // has always been "this town thinks well of you now", which is
              // reputation, and the director has ruled that reputation is the one
              // concept a player has to learn for it. `$target` binds the location
              // the scene is standing in; a sentinel that binds anything else is
              // refused, so this still no-ops loudly rather than landing somewhere
              // wrong.
              kind: 'reputation_with',
              targetLocationId: '$target',
              delta: SLICE_KIN_WELCOME_DELTA,
            },
            // THR-1182 — the half the director's fix named second and THR-1175
            // stopped short of: *"plus a seeded return encounter … the roof
            // actually opens, on screen, as an encounter. That is what 'calling
            // it in' feels like for a place."* Until now the welcome was honest,
            // visible, and never once acted on — a promise the world held and
            // never paid.
            //
            // `inheritContext: true` copies this action's `targetId`, so the
            // return visit is at *this* town rather than a town-shaped one, and
            // the standing the scene is about is the standing the reaction above
            // just wrote. Planted from all three bands (here, and on the two
            // reactions the crit bands substitute wholesale), because kin are
            // stubborn at every band: the door opened, so the road bends back.
            SLICE_TABLE_SEED,
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          // THR-1130 — `slice.kin.the_room_carries_it` folded (Law 13 parity: it
          // reported a `reputation_tally`, which has no player surface). Its
          // sentence is the second one here; the tally effect below is untouched.
          overview:
            'By the second bowl she was telling the whole room, and the room was listening. ' +
            'By morning their name is in three more taprooms, and it comes off well in ' +
            'every telling.',
          changes: [
            {
              // State-first, place-anchored — see the note on
              // 'slice.kin.a_standing_welcome'. Same condition, louder room.
              id: 'slice.kin.a_standing_welcome_well',
              kind: 'reputation',
              title: 'A Standing Welcome',
              causeClause: 'They took the thanks graciously and let her say it in front of everyone',
              detail: '{target} keeps a door open for them, and says so to anyone who will listen.',
              polarity: 'gain',
              category: 'bond',
              direction: 'gain',
              // THR-1205 — the warm band writes the widest door, and now draws it.
              magnitude: { ladder: 'reputation', band: SLICE_KIN_WELCOME_BAND_WARM },
              stateNoun: { text: 'reputation with {target}', entityId: '$target', visualKind: 'location', tooltipId: 'ui.reputation_with' },
              concepts: [{ text: 'a standing welcome' }],
            },
            {
              id: 'slice.kin.the_keepsake',
              kind: 'item',
              title: 'The Pressed Keepsake',
              causeClause: 'She pressed it into their hand on the way out and would not discuss it',
              detail: 'They carry a keepsake from the fen road now, and her people will know it on sight.',
              polarity: 'gain',
              category: 'boon',
              direction: 'gain',
              // G1: carrier-anchored — see the note on 'slice.fullmoon.the_gift'.
              stateNoun: {
                text: 'the keepsake they carry',
                entityId: '$actor',
                visualKind: 'agent',
              },
              concepts: [{ text: 'a keepsake from the fen road' }],
            },
          ],
          reactions: [
            {
              id: 'slice.kin.accept_the_debt_well',
              label: 'Accept the thanks',
              intent: 'A meal, a story told rightly, a standing welcome — and a room that will repeat it.',
              effects: [
                {
                  // THR-1206 — see 'slice.kin.a_standing_welcome'. The crit band
                  // moves the same score further rather than writing a different
                  // kind of thing, so the chip can say *warmer* without the player
                  // having to learn a second mechanic.
                  kind: 'reputation_with',
                  targetLocationId: '$target',
                  delta: SLICE_KIN_WELCOME_DELTA_WARM,
                },
                {
                  kind: 'reputation_tally',
                  key: SLICE_ROAD_REPUTE_KEY,
                  delta: SLICE_REPUTE_GAIN,
                },
                {
                  // The design block's "pressed keepsake (item)" — promised in the
                  // header comment and never minted until THR-1097.
                  kind: 'spawn_artifact',
                  category: 'mundane',
                  targetAgentId: '$actor',
                  nameOverride: 'The Pressed Keepsake',
                  messageOverride: 'A keepsake pressed into the traveler’s hand by the fen-road family’s kin.',
                },
                // THR-1182 — restated, not inherited. `applyAftermathOutcomeBand`
                // replaces `reactions` WHOLESALE (rule 1 in this file's aftermath
                // header), so a band that authors its own reaction drops the base
                // reaction's seed by omission. This is the widest-door band; the
                // return visit is the same scene, at the town that now says so to
                // anyone who will listen.
                SLICE_TABLE_SEED,
              ],
            },
          ],
        },
        success_at_cost: {
          overview:
            'The thanks was taken, and taken, and taken — three retellings and a toast, each ' +
            'one a little further from what happened. The bowl went cold twice. Underneath ' +
            'all of it the welcome is real.',
          changes: [
            {
              // State-first, place-anchored — see the note on
              // 'slice.kin.a_standing_welcome'.
              id: 'slice.kin.a_standing_welcome_dearly',
              kind: 'reputation',
              title: 'A Standing Welcome, an Evening Spent',
              causeClause: 'The thanks was taken three times over, with a toast, and the bowl went cold twice',
              detail: '{target} keeps a door open for them, and they paid for it with most of a night of being talked about.',
              // THR-1205 — was `mixed`, which painted this chip red under a
              // green-meaning up arrow. The welcome is a gain; the evening it
              // cost is not a write, so it stays in the band's `overview` and
              // this sentence rather than becoming a second chip (Law 56).
              polarity: 'gain',
              category: 'bond',
              direction: 'gain',
              // Same door as the plain success — the base reaction writes
              // `SLICE_KIN_WELCOME_INTENSITY` here. What the band cost was time,
              // not warmth, so the cluster must not shrink to imply otherwise.
              magnitude: { ladder: 'reputation', band: SLICE_KIN_WELCOME_BAND },
              stateNoun: { text: 'reputation with {target}', entityId: '$target', visualKind: 'location', tooltipId: 'ui.reputation_with' },
              concepts: [{ text: 'a standing welcome' }],
            },
          ],
        },
        critical_failure: {
          overview:
            'The thanks ran long, in front of half the room, and the traveler stood in it all ' +
            'evening. She meant every word of it. It still landed like a bill. The family ' +
            'stays welcoming — kin are stubborn that way — just less than they were going to be.',
          changes: [
            {
              // State-first, place-anchored — see the note on
              // 'slice.kin.a_standing_welcome'. The band writes the same
              // condition at the fumbled intensity, so the chip says a *cooler*
              // welcome rather than a different thing.
              id: 'slice.kin.a_cooler_welcome',
              kind: 'reputation',
              title: 'A Cooler Welcome',
              causeClause: 'The thanks was honest, public, and long, and they stood it badly',
              detail: '{target} keeps the door open anyway. It is a narrower door than it was going to be.',
              // THR-1205 — the chip the director screenshotted. `mixed` made it
              // red; it is a gain, just the smallest one this beat can produce.
              // A weaker-than-hoped grant is a *smaller green* cluster, never a
              // red one — that is what the fumbled band constant below draws.
              polarity: 'gain',
              category: 'bond',
              direction: 'gain',
              magnitude: { ladder: 'reputation', band: SLICE_KIN_WELCOME_BAND_FUMBLED },
              stateNoun: { text: 'reputation with {target}', entityId: '$target', visualKind: 'location', tooltipId: 'ui.reputation_with' },
              concepts: [{ text: 'a standing welcome' }],
            },
          ],
          reactions: [
            {
              id: 'slice.kin.accept_the_debt_awkwardly',
              label: 'Take the thanks anyway',
              intent: 'She meant every word of it, and said so again at the door.',
              effects: [
                {
                  // THR-1206 — see 'slice.kin.a_standing_welcome'. Fumbled delta,
                  // same score: kin are stubborn, the door stays open, it just does
                  // not open as wide.
                  kind: 'reputation_with',
                  targetLocationId: '$target',
                  delta: SLICE_KIN_WELCOME_DELTA_FUMBLED,
                },
                // THR-1182 — restated for the same wholesale-replacement reason
                // as the warm band. The fumbled welcome is the tightest window
                // the seed has to ripen inside (20 ticks before the edge prunes),
                // and `SLICE_TABLE_DELAY_TICKS` is set against exactly it.
                SLICE_TABLE_SEED,
              ],
            },
          ],
        },
      },
    },
  },
  narrativeTemplates: {
    initiation: 'Word of the fen-road kindness has run ahead of the traveler.',
    success: 'The thanks was taken well, and a family’s memory now has the traveler in it.',
    failure: 'The gratitude was fumbled, and the room let it drop politely.',
  },
  description:
    'Word of the fen-road kindness has run ahead of the traveler, and the family means to ' +
    'repay it in front of company. A god can steady the thanks, or let it fumble.',
};

// ═════════════════════════════════════════════════════════════════════
// 9. THE TABLE THAT HOLDS — Seeded Sequel of The Grateful Kin (THR-1182)
// ═════════════════════════════════════════════════════════════════════
//
// Crux: the town that keeps a door open for the traveler has split into two
//       camps that will not speak, and riders are on the fen road tonight.
// Shape: Personality Fork · Setting: rural + urban · Pressure: fear ·
// Form: division · Objective: broker · Stakes: the welcome itself ·
// System: cards + forks + conditions + reputation.
// Step 0: Heart — "Bring both camps" (the table, and whether it holds).
// Fork:   the mortal's own answer on courage_prudence —
//           positive → Stone, stand the fen road as one body;
//           negative → Eye,   empty the fen-side steadings before dawn.
// Why here: the parent minted the standing, and the seed carries this scene
//       back to the same town (`inheritContext`).
//
// **The brief** (Christian, chat 2026-08-24, approval recorded on THR-1182):
// "The Table That Holds", drawn from `hook.unlikely_alliance` under the
// 2026-08-24 game-design-first authoring order. Both review agents ranked it
// first and both flagged the same carry-forward risk — step 2 is
// combat-adjacent and the corpus has **no nudge-native combat vocabulary**.
// So neither fork variant is a fight. The riders are weather: the courage path
// is about numbers, footing and nerve in a narrow place, and the prudence path
// is about seeing what moves first and what gets left. Movement, wounds, hard
// choices — the vocabulary the game already has.
//
// **Why the gate is `Respected` and not `Accepted`.** `REPUTATION_WITH_DEFAULT`
// is 0.5, which bands as `Accepted`, so a gate at `Accepted` is cleared by a
// stranger who has never been here — a gate that never rejects is not a gate.
// See `SLICE_TABLE_GATE_BAND`. The gate binds the *organic* draw only: a
// `templateId` seed spawns its template directly (`encounterSeeding.ts`), so the
// return visit arrives from all three parent bands regardless, and the gate is
// what lets the same scene also arise at any town whose regard the traveler has
// genuinely earned.
//
// Connected systems (Q8): cast, rewards, reputation, conditions — four.
// Choice: the mortal's, on courage_prudence. The god leans; fate settles it.
// Promise→payoff: the opening promises a table and a road; both fork endings
// answer both.

/** The night's work done well — the door opens wider than it did. */
export const SLICE_TABLE_WELCOME_DEEPENED = 0.1;
/** Held, plainly. The welcome is renewed rather than spent. */
export const SLICE_TABLE_WELCOME_RENEWED = 0.06;
/** Held, and it cost the room something to hold. A smaller renewal. */
export const SLICE_TABLE_WELCOME_TOLL = 0.02;
/** The table broke. Calling in a welcome and wasting it spends it. */
export const SLICE_TABLE_WELCOME_SPENT = -0.06;
/** It broke badly, in front of everyone, and the town watched it break. */
export const SLICE_TABLE_WELCOME_SPENT_HARD = -0.1;

/**
 * The same five moves as drawn magnitudes (THR-1205's rule, applied here at
 * authoring time rather than retrofitted): the cluster the player sees scales
 * with the door the reaction actually moves, in both directions.
 */
export const SLICE_TABLE_BAND_DEEPENED = 3;
export const SLICE_TABLE_BAND_RENEWED = 2;
export const SLICE_TABLE_BAND_TOLL = 0;
export const SLICE_TABLE_BAND_SPENT = 2;
export const SLICE_TABLE_BAND_SPENT_HARD = 3;

const TABLE_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared `focus` family, the common option.
    id: 'slice.table.plain_words',
    name: 'Ready the Words',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine: 'The first sentence comes out short and free of blame, and both camps hear the same one.',
    bandProse: {
      success: 'The first sentence landed clean, and neither camp had to answer it.',
      near_miss: 'The words stayed plain to the end. The night ran out before the agreement did.',
    },
  },
  {
    // Type: Boost — sphere-keyed (time), and one of the fork's two levers. It
    // argues for standing: families who have shared a road that long can hold
    // one narrow place together.
    id: 'slice.table.long_neighbours',
    name: 'Weigh the Years',
    sphere: 'time',
    essenceCost: 1,
    forecastDelta: 0.07,
    poleLean: { axis: 'courage_prudence', toward: 'positive' },
    imageTag: 'generic.memory',
    effectLine:
      'How long these two families have shared one road comes to the surface, and the quarrel looks its age. It argues for standing.',
    bandProse: {
      critical_success: 'They worked back through forty years of shared road and found no year worth this.',
      failure: 'The long memory came up, and both camps found different grievances in it.',
    },
  },
  {
    // Type: Boost — sphere-keyed (order), the fork's other lever. It argues for
    // moving: a count of what can be carried is an argument against a road.
    id: 'slice.table.cold_count',
    name: 'Tally the Carts',
    sphere: 'order',
    essenceCost: 2,
    forecastDelta: 0.08,
    poleLean: { axis: 'courage_prudence', toward: 'negative' },
    imageTag: 'generic.ward',
    effectLine:
      'The room is held to a count of hands and hours, so the plan is argued from a real number. It argues for moving.',
    bandProse: {
      success_at_cost: 'The count came out honest, and honest was lower than either camp had claimed.',
      failure: 'The count was made twice and disputed both times, and the hours went into the disputing.',
    },
  },
  {
    // Type: Bargain — sphere-keyed (entropy). Free in essence, paid on the doom
    // clock (THR-885 cost channel one of two).
    id: 'slice.table.borrowed_hours',
    name: 'Pay It Elsewhere',
    sphere: 'entropy',
    essenceCost: 0,
    forecastDelta: 0.12,
    imageTag: 'generic.decay',
    costs: { doomDelta: 0.05 },
    effectLine:
      'No essence changes hands — the riders take the long bank of the fen, and the world’s doom clock runs a shade faster.',
    bandProse: {
      success: 'The extra hours were spent well, and the table used every one of them.',
      failure: 'The hours arrived. The argument grew to fill them exactly.',
    },
  },
  {
    // Type: Heavy Hand — sphere-keyed (force). Big delta, so both a `failure`
    // and a `critical_failure` fragment are owed; paid in detection pressure
    // (cost channel two).
    id: 'slice.table.hands_on_the_table',
    name: 'Still the Room',
    sphere: 'force',
    essenceCost: 2,
    forecastDelta: 0.16,
    imageTag: 'generic.energy',
    costs: { detectionDelta: 0.15 },
    effectLine:
      'Every hand rests flat where it can be seen while the traveler speaks. Rival gods can hardly miss it.',
    bandProse: {
      critical_success: 'The stillness held through the whole plan, and both camps heard all of it.',
      failure: 'The room went still on cue, and the stillness turned out to be two camps waiting.',
      critical_failure:
        'The stillness broke so hard that the breaking became the story the town told after.',
    },
  },
  {
    // Type: Omen — sphere-keyed (spirit). The hand's world-changing card: the
    // grant plants a cultural omen through the existing `emit_omen` door, so
    // later draws bend toward a fen road that is being watched.
    id: 'slice.table.word_down_the_road',
    name: 'Send the Word',
    sphere: 'spirit',
    essenceCost: 1,
    forecastDelta: 0.05,
    imageTag: 'generic.rumor',
    effectLine: 'The country downriver begins to talk about who is riding the fen.',
    grants: [
      {
        kind: 'emit_omen',
        category: 'cultural',
        intensity: 0.3,
        narrativeHook:
          'Word is going down the fen road ahead of the riders, and the steadings on it have started keeping watch.',
        scope: { kind: 'global' },
        sphereAlignment: 'spirit',
      },
    ],
    bandProse: {
      success_at_cost: 'Word went out ahead of the riders, and it went out ahead of the plan as well.',
      near_miss: 'The road carried word of the riders. It did not carry it fast enough.',
    },
  },
];

/**
 * Step 0 — Heart. Difficulty 0.40, inside the open-draw ceiling
 * (`NUDGE_OFF_REACH_MAX_DIFFICULTY`, 0.45) because this is `background` tier.
 *
 * `continue_weakened`, not `fail_action`: a table that breaks up still leaves
 * the town with riders on the road and a plan to make in two rooms instead of
 * one. The fork below runs either way — that is the whole shape of the scene.
 *
 * The failure side mints the state the endings narrate (prose rule 7): a night
 * spent arguing leaves the body spent, so `exhausted` is applied by the step
 * outcome, and the fallback's rest reaction is the honest mercy on every band.
 * No authored `factorLines` — the variance rule; every fact this scene holds is
 * true on every run and is priced into 0.40.
 */
const TABLE_STEP: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 2 },
  difficulty: 0.4,
  purposeLine: 'Bring both camps',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  failureMetadata: {
    effects: [{ kind: 'apply_condition', conditionTraitId: 'trait.condition.exhausted' }],
  },
  // The P2+P3 spine (Doctrine v2). The per-class P1 arrival lands above this
  // at instantiation. The keeper is introduced here by cast token.
  narrativeTemplate:
    'Two families here have stopped speaking, and the town has picked sides behind them. At dusk a lookout ' +
    'counted riders on the fen road, half a night out. The keeper, {cast:keeper}, has sat both camps down ' +
    'at one table.\n\n' +
    'The traveler is the only one both sides will hear. Get two families onto one plan before the light goes.',
  successAfterimage: 'Both camps agreed to one plan and stayed at the table while it was laid out.',
  failureAfterimage: 'The table broke up, and each camp went off to make its own arrangements.',
  successAtCostAfterimage:
    'They agreed, after one camp said aloud what it had been saving up for a year.',
  criticalSuccessAfterimage:
    'By the second round of the argument the two camps were finishing each other’s sentences.',
  criticalFailureAfterimage:
    'The table went over, and the rest of the night was argued in two separate rooms.',
  nudges: TABLE_HAND,
};

/** Courage — the town goes out and holds the narrow place on the fen road. */
const TABLE_STAND_STEP: ActionStep = {
  reach: 'stone',
  duration: { min: 1, max: 2 },
  difficulty: 0.42,
  purposeLine: 'Hold the road',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The fen road narrows to a causeway a cart wide, with black water on both sides of it. ' +
    'Everyone the town can put on their feet stands across that width with lamps up. ' +
    'The work is standing there: shoulder to shoulder, footing on wet stone, holding the ' +
    'line long enough for the riders to count it and do the arithmetic.',
  successAfterimage: 'The lamps held the causeway, and the riders counted them and turned.',
  failureAfterimage: 'The line bent at one end, and the riders came through the gap it left.',
  successAtCostAfterimage:
    'The causeway held, and two of the town went into the fen water getting it held.',
  criticalSuccessAfterimage:
    'The line never moved, and the riders turned at a distance without testing it once.',
  criticalFailureAfterimage:
    'The line broke in the dark on wet stone, and the town came back off the causeway carrying people.',
};

/** Prudence — the fen-side steadings are emptied before the riders arrive. */
const TABLE_MOVE_STEP: ActionStep = {
  reach: 'eye',
  duration: { min: 1, max: 2 },
  difficulty: 0.38,
  purposeLine: 'Empty the steadings',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The steadings on the fen side hold people, stock and a winter’s grain, and there are ' +
    'hours enough to move two of those three. The work is seeing which two: which barn ' +
    'stays shut, which cart goes first, which household is told to leave the year’s ' +
    'threshing standing in the yard and walk.',
  successAfterimage: 'The fen side was empty by dawn, and the grain was what stayed behind.',
  failureAfterimage: 'The carts were still loading at first light, out where the road runs open.',
  successAtCostAfterimage:
    'Everyone came in behind the ditch, and half a winter’s grain stayed in the barns.',
  criticalSuccessAfterimage:
    'People, stock and grain all came in, because the order they went in was worked out first.',
  criticalFailureAfterimage:
    'The wrong barn was emptied first, and the household that was told to wait was still waiting at dawn.',
};

const TABLE_FORK: ActionStepBranch = {
  branchOnStep: 0,
  decidedBy: { axis: 'courage_prudence' },
  variants: {
    positive: TABLE_STAND_STEP,
    negative: TABLE_MOVE_STEP,
  },
  fallback: TABLE_MOVE_STEP,
};

/**
 * Cast (Composition Contract, ruling 6) — declared explicitly because the
 * envelope spans two classes.
 *
 * Class-honesty is the rule this bundle has to satisfy: every bound person must
 * exist at every class the envelope declares. Checked against
 * `LOCATION_ROLE_ROSTERS` — `innkeeper` is 1.0 at hamlet, town, city and
 * capital; `guard` runs 0.8–1.0 across all four; `healer` 0.5–1.0. The rural
 * default's `elder` and the exemplar's `wanderer`/`pilgrim` are hamlet-only and
 * would have been placeless at every urban subtype, which is exactly the failure
 * the explicit-bundle rule exists to prevent.
 *
 * The keeper is the point of the scene: she is the roof the parent encounter's
 * standing is *with*, so the return visit happens under it.
 */
const TABLE_SUPPORT_BUNDLE: EncounterSupportBundle = [
  {
    kind: 'actor',
    key: 'keeper',
    delivery: 'pre-seeded',
    persistence: 'must-persist',
    reuseNpcRoles: ['innkeeper', 'brewer'],
    supportRole: 'roof_keeper',
    spawnNpcRole: 'innkeeper',
    spawnName: 'Hesta Ryle',
  },
  {
    kind: 'actor',
    key: 'warden',
    delivery: 'pre-seeded',
    persistence: 'must-persist',
    reuseNpcRoles: ['guard'],
    supportRole: 'town_watch',
    spawnNpcRole: 'guard',
    spawnName: 'Ode Fenwick',
  },
  {
    kind: 'actor',
    key: 'mender',
    delivery: 'lazy-materialize-on-trigger',
    persistence: 'must-persist',
    reuseNpcRoles: ['healer'],
    supportRole: 'town_healer',
    spawnNpcRole: 'healer',
    spawnName: 'Bern Attaway',
  },
];

/** The chip every band on this encounter draws, at the size that band moved. */
function tableStandingChip(
  id: string,
  title: string,
  causeClause: string,
  detail: string,
  direction: 'gain' | 'loss',
  band: number,
) {
  return {
    id,
    kind: 'reputation' as const,
    title,
    causeClause,
    detail,
    polarity: direction,
    category: 'bond' as const,
    direction,
    magnitude: { ladder: 'reputation' as const, band },
    stateNoun: {
      text: 'reputation with {target}',
      entityId: '$target',
      visualKind: 'location' as const,
      tooltipId: 'ui.reputation_with',
    },
    concepts: [{ text: 'the door they keep open' }],
  };
}

/** The standing move each band writes. Ids are per-band; the shape is not. */
function tableStandingReaction(id: string, label: string, intent: string, delta: number) {
  return {
    id,
    label,
    intent,
    effects: [
      {
        kind: 'reputation_with' as const,
        targetLocationId: '$target',
        delta,
      },
    ],
  };
}

export const SLICE_TABLE_THAT_HOLDS: UnifiedActionTemplate = {
  id: SLICE_TEMPLATE_IDS.tableThatHolds,
  rarityTier: 3,
  intrinsicTier: 'background',
  name: 'The Table That Holds',
  reach: 'heart',
  crudType: 'read',
  scale: 'local',
  steps: [TABLE_STEP, TABLE_FORK],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  /**
   * THR-1182 — the organic gate. Not `requiredTargetTraits`: the condition that
   * clause named (`trait.condition.location.standing_welcome`) was left with zero
   * writers by THR-1206, so gating on it would gate on a thing nothing produces.
   * Checked against this encounter's own target, which is the place the scene
   * stands in, at both filter sites.
   */
  requiredReputationWith: { atLeast: SLICE_TABLE_GATE_BAND },
  settings: ['rural', 'urban'],
  // P1 arrival (Doctrine v2) — the P2/P3 spine lands below it (TABLE_STEP).
  openings: {
    rural: '{name} returns to {location}, the town that keeps a door open for them.',
    urban: '{name} comes back to {location}, where a door is kept open for them.',
  },
  locationSubtypes: expandSettings(['rural', 'urban']),
  supportBundle: TABLE_SUPPORT_BUNDLE,
  aftermathConfig: {
    // The deciding step, not the fork's own index (THR-979). TABLE_FORK
    // declares `branchOnStep: 0`.
    branchOnStep: 0,
    variants: {
      positive: {
        overview:
          'The town went out to the causeway together and came back off it together. ' +
          'Whatever the two families still hold against each other, they held one width ' +
          'of wet stone first.',
        changes: [
          tableStandingChip(
            'slice.table.stood_together',
            'A Welcome Renewed',
            'They put two camps on one causeway and the causeway held',
            '{target} keeps the door open for them, and the households on both ends of the quarrel know why.',
            'gain',
            SLICE_TABLE_BAND_RENEWED,
          ),
        ],
        reactions: [
          tableStandingReaction(
            'slice.table.stand_taken',
            'Stand with them',
            'Lamps up on the causeway until the riders do the arithmetic.',
            SLICE_TABLE_WELCOME_RENEWED,
          ),
        ],
        byOutcome: {
          critical_success: {
            overview:
              'The riders turned at a distance and never came close enough to test the line. ' +
              'The town is still telling it the following week, and telling it as one story ' +
              'instead of two.',
            changes: [
              tableStandingChip(
                'slice.table.the_causeway_night',
                'A Welcome Deepened',
                'The line never moved, and the riders turned without testing it',
                '{target} keeps the door open wider than before, and says so to the road.',
                'gain',
                SLICE_TABLE_BAND_DEEPENED,
              ),
              {
                id: 'slice.table.the_lamp',
                kind: 'item' as const,
                title: 'The Causeway Lamp',
                causeClause: 'The keeper put it in their hand at the near end and did not ask for it back',
                detail: 'They carry the lamp that stood at the near end of the causeway that night.',
                polarity: 'gain' as const,
                category: 'boon' as const,
                direction: 'gain' as const,
                stateNoun: {
                  text: 'the lamp they carry',
                  entityId: '$actor',
                  visualKind: 'agent' as const,
                },
                concepts: [{ text: 'the causeway lamp' }],
              },
            ],
            // ONE reaction carrying both writes, not two the player chooses
            // between. The band economy owes this ending a deepened welcome
            // *and* a prize; authored as two reactions they become rivals,
            // because a run applies exactly one — so the crit band would have
            // paid out half of what it promised, whichever half was picked.
            reactions: [
              {
                id: 'slice.table.stand_taken_well',
                label: 'Stand with them',
                intent: 'Lamps up, the line does not move, and the keeper presses the lamp on them after.',
                effects: [
                  {
                    kind: 'reputation_with' as const,
                    targetLocationId: '$target',
                    delta: SLICE_TABLE_WELCOME_DEEPENED,
                  },
                  {
                    kind: 'spawn_artifact' as const,
                    category: 'mundane' as const,
                    targetAgentId: '$actor',
                    nameOverride: 'The Causeway Lamp',
                    messageOverride:
                      'A lamp that stood at the near end of a fen causeway while two families held it together.',
                  },
                ],
              },
            ],
          },
          success_at_cost: {
            overview:
              'The causeway held and two of the town went into the fen water holding it. ' +
              'They were pulled out cold and coughing, and the argument about whose fault ' +
              'that was started before they were dry.',
            changes: [
              tableStandingChip(
                'slice.table.held_wet',
                'A Welcome Renewed, a Night Paid For',
                'The line held, and two of the town went into the water holding it',
                '{target} keeps the door open for them, and counts what the night cost while doing it.',
                'gain',
                SLICE_TABLE_BAND_TOLL,
              ),
            ],
            reactions: [
              tableStandingReaction(
                'slice.table.stand_taken_wet',
                'Stand with them',
                'Hold the width, and pull out whoever goes in.',
                SLICE_TABLE_WELCOME_TOLL,
              ),
            ],
          },
          failure: {
            overview:
              'The line bent at the end where the two families met, and the riders came ' +
              'through the gap it left. The town spent the rest of the night deciding which ' +
              'camp had bent first.',
            changes: [
              tableStandingChip(
                'slice.table.the_gap',
                'A Welcome Spent',
                'They put the town on a causeway and the causeway opened at the seam',
                '{target} keeps a cooler door for them now — the plan was theirs, and it had a gap in it.',
                'loss',
                SLICE_TABLE_BAND_SPENT,
              ),
            ],
            reactions: [
              tableStandingReaction(
                'slice.table.stand_broken',
                'Take the blame for the plan',
                'It was their plan, and the gap was in it.',
                SLICE_TABLE_WELCOME_SPENT,
              ),
            ],
          },
          critical_failure: {
            overview:
              'The line went down in the dark on wet stone and the town came back off the ' +
              'causeway carrying people. It is {cast:mender} who works through the small ' +
              'hours, and the traveler who stood at the door counting them in.',
            changes: [
              tableStandingChip(
                'slice.table.carried_back',
                'A Welcome Spent Badly',
                'They put the town on a causeway in the dark and the town came back carrying people',
                '{target} keeps the door open out of habit now, and the habit is thinner than it was.',
                'loss',
                SLICE_TABLE_BAND_SPENT_HARD,
              ),
            ],
            reactions: [
              tableStandingReaction(
                'slice.table.stand_ruined',
                'Take the blame for the plan',
                'They stood where the traveler put them.',
                SLICE_TABLE_WELCOME_SPENT_HARD,
              ),
            ],
          },
        },
      },
      negative: {
        overview:
          'The fen side came in behind the ditch overnight — people first, stock after, ' +
          'and the grain left standing where it was. Two families did the carrying in the ' +
          'same carts, which is further than they had got in a year.',
        changes: [
          tableStandingChip(
            'slice.table.moved_in_time',
            'A Welcome Renewed',
            'They emptied the fen side overnight and both camps loaded the same carts',
            '{target} keeps the door open for them, and the households that walked in know whose count it was.',
            'gain',
            SLICE_TABLE_BAND_RENEWED,
          ),
        ],
        reactions: [
          tableStandingReaction(
            'slice.table.move_taken',
            'Move them tonight',
            'People first, stock after, the grain left standing.',
            SLICE_TABLE_WELCOME_RENEWED,
          ),
        ],
        byOutcome: {
          critical_success: {
            overview:
              'People, stock and grain all came in behind the ditch, because the order they ' +
              'went in was worked out before the first cart moved. The riders found empty ' +
              'yards and shut barns and rode on down the fen.',
            changes: [
              tableStandingChip(
                'slice.table.nothing_left_out',
                'A Welcome Deepened',
                'The order was worked out first, and the riders found empty yards',
                '{target} keeps the door open wider than before, and the barns are still full.',
                'gain',
                SLICE_TABLE_BAND_DEEPENED,
              ),
              {
                id: 'slice.table.the_ledger',
                kind: 'item' as const,
                title: 'The Loading Order',
                causeClause: 'The keeper copied it out fair and pressed the copy on them at the gate',
                detail: 'They carry a fair copy of the order the fen side was emptied in.',
                polarity: 'gain' as const,
                category: 'boon' as const,
                direction: 'gain' as const,
                stateNoun: {
                  text: 'the loading order they carry',
                  entityId: '$actor',
                  visualKind: 'agent' as const,
                },
                concepts: [{ text: 'the loading order' }],
              },
            ],
            // One reaction, both writes — see the note on the causeway band.
            reactions: [
              {
                id: 'slice.table.move_taken_well',
                label: 'Move them tonight',
                intent: 'Every cart in an order worked out before it rolled, and the keeper copies it out fair after.',
                effects: [
                  {
                    kind: 'reputation_with' as const,
                    targetLocationId: '$target',
                    delta: SLICE_TABLE_WELCOME_DEEPENED,
                  },
                  {
                    kind: 'spawn_artifact' as const,
                    category: 'mundane' as const,
                    targetAgentId: '$actor',
                    nameOverride: 'The Loading Order',
                    messageOverride:
                      'A fair copy of the order a fen-side hamlet was emptied in, one night ahead of riders.',
                  },
                ],
              },
            ],
          },
          success_at_cost: {
            overview:
              'Everyone came in behind the ditch and half a winter’s grain stayed in the ' +
              'barns for the riders to find. The households that lost theirs are counting it ' +
              'out loud, and counting it at the traveler.',
            changes: [
              tableStandingChip(
                'slice.table.grain_left',
                'A Welcome Renewed, a Winter Short',
                'Every household walked in, and half the winter’s grain stayed in the barns',
                '{target} keeps the door open for them, and two households are short a winter because of the order.',
                'gain',
                SLICE_TABLE_BAND_TOLL,
              ),
            ],
            reactions: [
              tableStandingReaction(
                'slice.table.move_taken_short',
                'Move them tonight',
                'People and stock. The grain can be grown again.',
                SLICE_TABLE_WELCOME_TOLL,
              ),
            ],
          },
          failure: {
            overview:
              'The carts were still loading at first light, out where the fen road runs ' +
              'open, and what the riders took they took off the road. Both camps had loaded ' +
              'their own barns first.',
            changes: [
              tableStandingChip(
                'slice.table.still_loading',
                'A Welcome Spent',
                'Their order put both camps on the open road at first light',
                '{target} keeps a cooler door for them now — the order was theirs, and it ran long.',
                'loss',
                SLICE_TABLE_BAND_SPENT,
              ),
            ],
            reactions: [
              tableStandingReaction(
                'slice.table.move_failed',
                'Take the blame for the order',
                'It was their order, and it ran past dawn.',
                SLICE_TABLE_WELCOME_SPENT,
              ),
            ],
          },
          critical_failure: {
            overview:
              'The wrong barn was emptied first and the household told to wait was still ' +
              'waiting at dawn on the fen side. It is {cast:mender} who goes out to them ' +
              'with the warden at midday, and the town watches the traveler while they go.',
            changes: [
              tableStandingChip(
                'slice.table.left_waiting',
                'A Welcome Spent Badly',
                'Their order emptied the wrong barn first and left a household on the fen side',
                '{target} keeps the door open out of habit now, and the habit is thinner than it was.',
                'loss',
                SLICE_TABLE_BAND_SPENT_HARD,
              ),
            ],
            reactions: [
              tableStandingReaction(
                'slice.table.move_ruined',
                'Take the blame for the order',
                'They waited because the traveler’s order told them to.',
                SLICE_TABLE_WELCOME_SPENT_HARD,
              ),
            ],
          },
        },
      },
    },
    fallback: {
      overview:
        'The riders came up the fen road and the town met them the way the table had ' +
        'settled it. By morning the keeper’s floor is a floor again.',
      changes: [
        tableStandingChip(
          'slice.table.the_night_at_the_table',
          'A Welcome Renewed',
          'They were called in on a standing welcome and sat at the table until it settled',
          '{target} keeps the door open for them, and now keeps it open for a reason the whole town watched.',
          'gain',
          SLICE_TABLE_BAND_RENEWED,
        ),
      ],
      // One reaction carrying both writes, for the same reason the crit bands
      // do: a run applies exactly one, so a mercy split off into its own pick
      // would make resting and being remembered rivals.
      reactions: [
        {
          id: 'slice.table.stay_until_settled',
          label: 'Stay until it is settled',
          intent: 'See the night out with them, then sleep before the road.',
          effects: [
            {
              kind: 'reputation_with' as const,
              targetLocationId: '$target',
              delta: SLICE_TABLE_WELCOME_RENEWED,
            },
            { kind: 'remove_condition', conditionTraitId: 'trait.condition.exhausted' },
          ],
        },
      ],
    },
  },
  narrativeTemplates: {
    initiation:
      'The town that keeps a door open for the traveler has two families in it who will ' +
      'not sit together, and riders on the fen road tonight.',
    success: 'Two camps agreed on one plan in time, and the town met the road as one town.',
    failure: 'The table came apart, and the fen road found a town that had made two plans.',
  },
  description:
    'A two-step return visit at a town whose regard the traveler has earned: bring two ' +
    'feuding camps onto one plan before riders reach the fen road, then hold the causeway ' +
    'or empty the steadings, whichever way the mortal leans. A god can sway the table; ' +
    'fate settles what the night does with it.',
};

// ─── The slice, assembled ────────────────────────────────────────────

/**
 * THR-932: `compileOpeningEnvelope` turns each template's authored `openings` table
 * into the reserved `opening` fragment set and prepends its token to step 0. Without
 * it, `openings` on a direct-authored template is a field with no reader and every
 * approved scene-setting paragraph here ships but never renders. Applied once, at
 * module load — the two catalog spreads in `unified-action-templates.ts` both consume
 * this already-compiled array.
 */
export const VERTICAL_SLICE_TEMPLATES: readonly UnifiedActionTemplate[] = [
  SLICE_UNSAFE_BRIDGE,
  SLICE_SNOW_ON_THE_PASS,
  SLICE_RIDERS_BEHIND_CARAVAN,
  SLICE_BARGAIN_AT_CROSSROADS,
  SLICE_FULL_MOON_COLLECTION,
  SLICE_SWINDLED_FAMILY,
  SLICE_SWINDLER_FOUND,
  SLICE_GRATEFUL_KIN,
  SLICE_TABLE_THAT_HOLDS,
].map(compileOpeningEnvelope);
